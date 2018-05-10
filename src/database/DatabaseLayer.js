const mongo = require('mongodb');
const TradesSource = requireFromRoot('src/database/modules/TradesSource.js');
const CapitalGainsCalculation = requireFromRoot('src/database/modules/CapitalGainsCalculation.js');

class DatabaseLayer {
    constructor() {
        this._db = null;
        this.modules = null;
    }

    async connect(connectionString, databaseName) {
        const dbConnection = await mongo.MongoClient.connect(connectionString);
        this._db = dbConnection.db(databaseName);

        console.log('Connected to database: ' +  connectionString);
    
        this._initializeDatabaseModules();
    }

    _initializeDatabaseModules() {
        this.modules = {
            tradesSource: new TradesSource(this),
            capitalGainsCalculation: new CapitalGainsCalculation(this)
        };
    }

    db() {
        return this._db;
    }
}

module.exports = DatabaseLayer;