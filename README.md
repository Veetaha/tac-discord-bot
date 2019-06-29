# tac-discord-bot

[![Build Status](https://travis-ci.com/Veetaha/tac-discord-bot.svg?branch=master)](https://travis-ci.com/Veetaha/tac-discord-bot)
[![Coverage Status](https://coveralls.io/repos/github/Veetaha/tac-discord-bot/badge.svg?branch=master)](https://coveralls.io/github/Veetaha/tac-discord-bot?branch=master)


## Preliminary installations
* [`docker`](https://docs.docker.com/install/)
* [`docker-compose`](https://docs.docker.com/compose/install/)
* [`npm`](https://www.npmjs.com/get-npm)

To get started use these commands (`project-dir` is the name of the directory to copy this template to):

```bash
git clone https://github.com/Veetaha/tac-discord-bot.git project-dir
cd project-dir
npm install
npm run dev
```

## Scripts
|Command|Description|
|--|--|
|`start`      | Run discord bot in production mode                                |
|`dev`        | Run discord bot in development mode (supports debugger attachment)|
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
                                This declarations are provided for vanilla JavaScript packages.
* `/backend` - A directory where resides all your NodeJS code.
    * `tsconfig.json` - TypeScript compiler configuration file. It is set up to provide the most severe type checks level by default.
    * `polyfills.ts` - File that imports all your polyfills. Be sure to import it at the first line of your app.
                    
    * `app.ts` - Your NodeJS app entry point.
    * `/interfaces` - A directory that contains your type and interfaces declarations.
        * `index.ts` - File the reexports all interfaces defined in this directory. 
        It exports only backend-related type definitions and reexports `@common/interfaces`.
    * `/services` - A director the contains yoor app `'typedi'` services (singleton classes)
                    that participate in dependency injection system.
        * `debug.ts` - Example module that provides basic logging and assertions functionality.
        * `/cmd-handlers` - A directory that contains global discord command handling services.

    * `/modules` - A directory that contains your app modules (classes, utils functions etc.).
        `/discord` - A directory that contains low level discord command handling logic.
    * `/tests` - A directory that contains all your unit tests.
        * `run-all.ts` - A script that runs all the tests that reside in this folder.
* `/frontend` - Add your frontend here... *(temporarily absent)*

## Links

* [`'discord.js'`](https://discord.js.org/#/docs/main/stable/general/welcome)
* [``]