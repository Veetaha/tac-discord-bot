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
|`build`      | Compile TypeScript code to `build` directory.      |
|`clean`      | Remove build directory.                            |
|`start`      | Execute your compiled NodeJS app.                  |
|`build-start`| Build and run your app instantly.                  |
|`test`       | Run all your unit tests.                           |
|`update-deps`| Update all your dependencies to the latest version |


## File structure

* `.travis.yml` - [Travis CI](https://travis-ci.com/) configuration file.
* `.gitignore` - Git configuration file that defines ignored entries.
* `package.json` - Global package manager configuration file.
* `tslint.json` - Global TypeScript linter configuration file.
* `LICENCE` - MIT open source licence.
* `README.md` - File that documents this project.
* `/common` - A directory that contains code, that may be used on both ends.
    * `/ambient-declarations` - A directory that contains ambient modules declaration files.
    * `interfaces.ts` - File that exports some handy `type` and `interface` definitions.
* `/backend` - A directory where resides all your NodeJS code.
    * `tsconfig.json` - TypeScript compiler configuration file. It is set up to provide the most severe type checks level by default.
    * `app.ts` - Your NodeJS app entry point.
    * `/modules` - A directory that contains your app modules (classes, utils functions etc.)
        * `debug.ts` - Example module that provides basic logging and assertions functionality.
        * `interfaces.ts` - File that exports only backend-related type definitions and reexports `@common/interfaces`.
    * `/tests` - A directory that contains all your unit tests.
        * `run-all.ts` - A script that runs all the tests that reside in this folder.
* `/frontend` - Add your frontend here...

