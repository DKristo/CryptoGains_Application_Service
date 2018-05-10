const mongo = require('mongodb');

function newTradesSource(userId, trades) {
    return {
        _id: new mongo.ObjectID(),
        userId: userId,
        importedTimestamp: Date.now(),
        trades: trades
    };
}

class TradesSource {
    constructor(databaseLayer) {
        this._databaseLayer = databaseLayer;
    }

    async create(userId, trades) {
        const tradesSource = newTradesSource(userId, trades);
        const result = await this._databaseLayer.db().collection('TradesSource').insert(tradesSource, { w: 1 });

        return (result.result.n === 1);
    }

    async findById(id) {
        return await this._databaseLayer.db().collection('TradesSource').findOne({ _id: id });
    }

    async findByUserId(userId) {
        return await this._databaseLayer.db().collection('TradesSource').find({ userId: userId }).toArray();
    }

    async getAllTradesByUserId(userId) {
        const tradesByFile = [];
    
        const tradesSources = await this.findByUserId(userId);
    
        for (var i = 0; i < tradesSources.length; ++i) {
            tradesByFile.push(tradesSources[i].trades);
        }
    
        const allTrades = Array.prototype.concat.apply([], tradesByFile);
    
        allTrades.sort((a, b) => {
            return (a !== null ? a.timestamp : 0) - (b !== null ? b.timestamp : 0);
        });
    
        return allTrades;
    }
}

module.exports = TradesSource;