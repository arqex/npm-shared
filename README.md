npm shared
==========

This is a project in a EARLY ALPHA stage that aims to make easier share npm packages among projects in the same system.

It is so alpha that it may not work at all.

## Motivation

When you have several projects on your machine you are probably using the same npm packages once and again, and probably you have those modules repeated in the `node_modules` of every project. Couldn't we reuse the packages?

The way that node.js requires modules make easy to share them among projects. When you require some module absolutely using `var My = require('my')`, node looks for that module in `node_modules` folder of the current dir.

If the module can't be found, it goes to the parent dir and looks for it in its `node_modules` folder. This process is repeated until the module is found or it reaches the root directory.

So sharing your packages is not difficult: *place them in a `node_modules` folder inside of some parent directory of your projects*.

But then, manage those packages is messy, version conflicts may arise making your projects stop working.

`npm-shared` try to fix the problems you may have managing those shared modules, and make easier start reusing your projects' npm dependencies.

# Install
```
npm install -g npm-shared
```

## Usage

Imagine we have this folder structure in your machine
```
+ \
| + npmProjects
  | - project1
  | - project2
  | - project3
```
To share the dependencies among the projects 1,2 and 3 we will have our `node_modules` folder in the directory `npmProjects`, so we go there and we start it up doing
```
npm-shared init
```

That will create a special  `node_modules` folder for us in `npmProjects` where the shared dependencies will be installed. Then, you can go to your projects folder and make the dependency installation like:

```
cd project1
npm-shared install
```

That should install `project1` dependencies in `/npmProjects/node_modules`.

Keeping in mind that if the module is already installed in the shared modules folder...

* If the version is compatible with the one that the project is trying to install, it won't be installed but reused.
* If the version is not compatible, the module will be installed in the project's `node_modules` folder, avoiding the conflict with any project that already may be using the module in the shared folder.

## Todo list
The description above is the way I would like it to work, but the project is not at that point yet, this is the list of missing stuff:

- [x] Install modules in the shared folder using project's `package.json` file.
- [ ] Install a module in the shared folder using module's name.
- [ ] Update project's `package.json` when using `--save` `--save-dev` or `--save-optional` flags.
- [ ] Avoid conflicts between versions of the same module.
