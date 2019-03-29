// @ts-check
const ModuleAlias = require('module-alias');
const Path        = require('path');
const _           = require('lodash');

const tsConfigDir = pathFromRoot('backend');
const buildDir    = pathFromRoot('build/backend');

ModuleAlias.addAliases(mapTsConfigAliasesToModuleAliases(
    require(Path.join(tsConfigDir, 'tsconfig.json')).compilerOptions
));


function removeTrailingSlashStar(str){ 
    return /(.*?)\/?\*$/.exec(str)[1];
}

function mapTsConfigAliasesToModuleAliases({paths, baseUrl}) {
    return _.transform(paths, (result, value, key) => {
        result[removeTrailingSlashStar(key)] = Path.resolve(
            buildDir, baseUrl, removeTrailingSlashStar(value)
        );
    }, {});
}

function pathFromRoot(...pathParts) {
    return Path.resolve(__dirname, '..', ...pathParts);
}