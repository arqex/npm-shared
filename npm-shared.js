#! /usr/bin/env node

var shell = require('shelljs');
var yargs = require('yargs').argv;
var fs = require('fs');
var Path = require('path');


var entry = parseEntry();
var node_modules = 'node_modules';
var package_json = 'package.json';
var file_flag = Path.join( node_modules, 'npm-shared' );

if( entry.command === 'init' ){
  initShared();
}
else if( entry.command === 'install' ){
  var path = findSharedPath( __dirname ),
    sharedPath = findSharedPath( __dirname ),
    packageJson = sharedPath && fs.readFileSync( Path.join( sharedPath, package_json ) )
  ;

  if( !entry.args.length ){

  }

  console.log( path, packageJson );
}
else {
  console.log( entry );
  shell.exec('npm -v');
  findSharedPath( __dirname );
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
    return Path.join( origin, node_modules );
  }
  else {
    var nextPath = Path.join( origin, '..' );
    if( nextPath !== origin ){
      return findSharedPath( nextPath );
    }
    else {
      console.error("ERR: Couldn't find any npm shared folder initialized.");
      process.exit(1);
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
      return findPackageJson( nextPath );
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
