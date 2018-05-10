const mongo = require('mongodb');

function newCapitalGainsCalculation(userId) {
    return {
        _id: new mongo.ObjectID(),
        userId: userId,
        startedTimestamp: Date.now(),
        status: 'running',
        result: null
    };
}

class CapitalGainsCalculation {
    constructor(databaseLayer) {
        this._databaseLayer = databaseLayer;
    }

    async create(userId) {
        const job = newCapitalGainsCalculation(userId);
        const insertResult = await this._databaseLayer.db().collection('CalculationJobs').insert(job, { w: 1 });

        return (insertResult.result.n === 1) ? job : null;
    }

    async setResult(id, result) {
        const update = {
            result: result,
            status: 'complete'
        };

        const updateResult = await this._databaseLayer.db().collection('CalculationJobs').updateOne({ _id : id }, { $set: update }, { w: 1 });

        return (updateResult.result.n === 1);
    }

    async findById(id) {
        return await this._databaseLayer.db().collection('CalculationJobs').findOne({ _id: id });
    }

    async findByUserId(userId) {
        return await this._databaseLayer.db().collection('CalculationJobs').find({ userId: userId }).toArray();
    }
}

module.exports = CapitalGainsCalculation;