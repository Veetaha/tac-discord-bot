# basic-ts-nodejs-template

[![Build Status](https://travis-ci.com/Veetaha/basic-ts-nodejs-template.svg?branch=master)](https://travis-ci.com/Veetaha/basic-ts-nodejs-template)

This is a basic template project to start programming with TypeScript and NodeJS.
To get started use these commands (`project-dir` is the name of the directory to copy this template to):

```bash
git clone https://github.com/Veetaha/basic-ts-nodejs-template.git project-dir
cd project-dir
npm install
```

## Scripts
|Command|Description|
|--|--|
|`dev`        | Execute your app with ts-node and restart it on file changes.     |
|`start`      | Execute your app with ts-node.                                    |
|`start:debug`| Execute your app with ts-node and debugger attachment possibility.|
|`test`       | Run all your unit tests.                                          |
|`update-deps`| Update all your dependencies to the latest version.               |


## File structure

* `.travis.yml` - [Travis CI](https://travis-ci.com/) configuration file.
* `.gitignore` - Git configuration file that defines ignored entries.
* `package.json` - Global package manager configuration file.
* `tslint.json` - Global TypeScript linter configuration file.
* `LICENCE` - MIT open source licence.
* `README.md` - File that documents this project.
* `/.vscode` - A directory with vscode debug configurations.
* `/common` - A directory that contains code, that may be used on both ends.
    * `/ambient-declarations` - A directory that contains ambient modules declaration files.
    * `interfaces.ts` - File that exports some commonplace `type` and `interface` definitions.
* `/backend` - A directory where resides all your NodeJS code.
    * `tsconfig.json` - TypeScript compiler configuration file. It is set up to provide the most severe type checks level by default.
    * `polyfills.ts` - File that imports all your polyfills. Be sure to import it at the first line of your app.
                    
    * `app.ts` - Your NodeJS app entry point.
    * `/interfaces` - A directory that contains your type and interfaces declarations.
        * `index.ts` - File the reexports all interfaces defined in this directory. 
        It exports only backend-related type definitions and reexports `@common/interfaces`.
    * `/modules` - A directory that contains your app modules (classes, utils functions etc.).
        * `debug.ts` - Example module that provides basic logging and assertions functionality.
    * `/tests` - A directory that contains all your unit tests.
        * `run-all.ts` - A script that runs all the tests that reside in this folder.
* `/frontend` - Add your frontend here...

