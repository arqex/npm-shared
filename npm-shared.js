#! /usr/bin/env node

var shell = require('shelljs');
var yargs = require('yargs').argv;
var fs = require('fs');
var Path = require('path');
var versionResolver = require('resolve-package-versions')({});
var npmview = require('npmview');
var semver  = require('semver');

var npm = require('npm');


var entry = parseEntry();
var cwd = process.cwd();
var node_modules = 'node_modules';
var package_json = 'package.json';
var file_flag = Path.join( node_modules, 'npm-shared' );

if( entry.command === 'init' ){
  initShared();
}
else if( entry.command === 'install' ){
  var path = findSharedPath( cwd ),
    projectPath = findProjectPath( cwd ),
    packageJson = projectPath && fs.readFileSync( Path.join( projectPath, package_json ) )
  ;

  var config = packageJson && JSON.parse(packageJson) || {};

  return npm.load( config, function( err, npm ){
    console.log( npm );
  });

  if( !entry.args.length ){
    if( !packageJson ){
      abort('No module name given to install and there is not a package.json file to install modules');
    }

    safeCopy( Path.join( projectPath, package_json ), Path.join( path, package_json ) );

    shell.exec('npm install', {cwd: path}, function(){
      fs.unlink( Path.join( path, package_json ) );
      console.log('Everything worked ok.');
    });
  }
}
else if( entry.command == 'check' ){
  var path = findSharedPath( cwd ),
    projectPath = findProjectPath( cwd ),
    packageJson = projectPath && fs.readFileSync( Path.join( projectPath, package_json ) )
  ;

  if( packageJson ){
    getInstallInfo( packageJson, info => {
      console.log( info );
    });
  }
}
else {
  console.log( entry );
  shell.exec('npm -v');
  findSharedPath( cwd );
}

function initShared(){
  console.log( node_modules );
  if( !fs.existsSync( node_modules ) ){
    fs.mkdir( node_modules );
    console.log('node_modules folder created.');
  }
  else {
    console.log('node_modules folder was already created.');
  }

  if( !fs.existsSync( file_flag ) ){
    fs.writeFileSync( file_flag, 'Do not delete this file. It is used by npm-shared to install npm modules here.' );
    console.log('npm-shared was initialized here');
  }
  else {
    console.log('npm-shared was already initialized');
  }
}

function findSharedPath( origin ){
  console.log( origin );
  if( fs.existsSync( Path.join( origin, file_flag ))){
    return origin;
  }
  else {
    var nextPath = Path.join( origin, '..' );
    if( nextPath !== origin ){
      return findSharedPath( nextPath );
    }
    else {
      abort("Couldn't find any npm shared folder initialized.");
    }
  }
}

function findProjectPath( origin ){
  if( fs.existsSync( Path.join( origin, package_json ))){
    return origin;
  }
  else {
    var nextPath = Path.join( origin, '..' );
    if( nextPath !== origin ){
      return findProjectPath( nextPath );
    }
    else {
      return false;
    }
  }
}

function parseEntry(){
  var entry = {
      command: yargs._[0] || 'help',
      modifiers: {},
      args: []
    },
    arg
  ;

  parseModifier( entry, 'save', ['S', 'save'] );
  parseModifier( entry, 'saveDev', ['D', 'save-dev'] );
  parseModifier( entry, 'saveOptional', ['O', 'save-optional'] );
  parseModifier( entry, 'saveExact', ['E', 'save-exact'] );
  parseModifier( entry, 'force', ['f', 'force'] );
  parseModifier( entry, 'dryRun', ['dry-run']);
  parseModifier( entry, 'noBinLinks', ['no-bin-links']);
  parseModifier( entry, 'noOptional', ['no-optional']);

  for (var i = 1; i < yargs._.length; i++) {
    entry.args.push( yargs._[i] );
  }

  return entry;
}

function parseModifier( entry, name, cliNames ){
  var arg;

  cliNames.forEach( cliName => {
    arg = arg || yargs[cliName];
  });
  if( arg ){
    entry.modifiers[ name ] = true;
    if( arg !== true ){
      entry.args.push( arg );
    }
  }
}

function safeCopy( from, to ){
  if( fs.existsSync( to ) ){
    fs.unlinkSync( to );
  }
  fs.writeFileSync( to, fs.readFileSync( from ) );
}

function abort( reason ){
  console.error( 'ERR: ' + reason );
  process.exit(1);
}

function checkPackage( name, versionRange, clbk ){
  var installedVersion = isInstalled( name );

  npmview( name, (err, v, info) => {
    var output = name + '@' + versionRange + ' - Installed: ' + (installedVersion || 'none') + '. ';
    var maxVersion = semver.maxSatisfying( info.versions, versionRange );
    var toInstall = true;
    var location = 'shared';
    if( installedVersion ){
      if( semver.satisfies( installedVersion, versionRange ) ){
        output += 'No need to update.';
        toInstall = false;
      }
      else {
        output += maxVersion + ' will be installed in the project folder.';
        location = 'project';
      }
    }
    else {
      output += 'v' + maxVersion + ' will be installed in the shared folder.';
    }
    console.log( output );
    console.log( 'Max version: ' + maxVersion );

    clbk && clbk( toInstall ? {name: name, version: maxVersion, location: location} : false );
  });
  // console.log( command + ': ' + output.stdout, output.stderr );

}

function getInstallInfo( packageInfo, clbk ){
  var dependencies = JSON.parse(packageJson).dependencies,
    names = Object.keys( dependencies ),
    allInfo = {project: [], shared: []},
    handled = 0
  ;

  console.log( 'number of dependencies: ' + names.length );

  names.forEach( name => {
    checkPackage( name, dependencies[ name ], info => {

      if( info ){
        allInfo[info.location].push( info );
      }

      console.log( info, handled );

      if( ++handled === names.length ){
        clbk && clbk( allInfo );
      }
    });
  });
}

function isInstalled( name ){
  var modulePath = Path.join( findSharedPath( process.cwd() ), 'node_modules', name );
  if( fs.existsSync( modulePath ) ){
    var info = parsePackage( Path.join( modulePath, 'package.json' ) );
    return info && info.version;
  }
  else {
    return false;
  }
}

function parsePackage( path ){
  if( !fs.existsSync( path ) ){
    return false;
  }
  else {
    return JSON.parse( fs.readFileSync( path ) );
  }
}
