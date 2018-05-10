module.exports = function (baseCurrency, quoteCurrency, type, unitPrice, volume, fee, timestamp, source) {
    return {
        baseCurrency: baseCurrency,
        quoteCurrency: quoteCurrency,
        type: type,
        unitPrice: unitPrice,
        volume: volume,
        fee: fee,
        timestamp: timestamp,
        source: source
    };
}