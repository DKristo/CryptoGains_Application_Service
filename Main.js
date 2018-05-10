const fs = require('fs');
const cluster = require('cluster');
const path = require('path');

global.globalRootDirectory = path.resolve(__dirname);
global.requireFromRoot = (path) => {
    return require(global.globalRootDirectory + '/' + path);
}

const DatabaseLayer = requireFromRoot('src/database/DatabaseLayer.js');

const configuration = JSON.parse(fs.readFileSync(global.globalRootDirectory + '/configuration.json'));

if (cluster.isMaster) {
    const numCpus = require('os').cpus().length;

    for (let i = 0; i < numCpus; ++i) {
        cluster.fork();
    }
} else {
    const express = require('express');
    const bodyParser = require('body-parser');
    const app = express();

    app.set('trust proxy', configuration.expressTrustProxy);
    app.use(bodyParser.json({ limit: '50mb' }));
    app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

    (async () => {
        const database = new DatabaseLayer();
        await database.connect(configuration.databaseConnectionString, configuration.databaseName);

        app.use('/', (requireFromRoot('src/api/Api.js'))(database));
    
        const server = app.listen(configuration.port, function () {
            console.log('Application Service Started');
        });
    })();
}