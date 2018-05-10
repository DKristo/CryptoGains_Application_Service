const express = require('express');
const ApiSources = requireFromRoot('src/api/ApiSources.js');
const ApiCapitalGains = requireFromRoot('src/api/ApiCapitalGains.js');

module.exports = (database) => {
    const router = express.Router();

    ApiSources(database, router);
    ApiCapitalGains(database, router);

    return router;
};