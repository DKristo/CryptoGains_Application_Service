const CurrencyExchangeRateFetcher = requireFromRoot('src/currency_exchange_rates/CurrencyExchangeRateFetcher.js');
const calculateWithAdjustedBaseCost = requireFromRoot('src/calculation/CalculateWithAdjustedCostBase.js');
const TrackedAssets = requireFromRoot('src/TrackedAssets.js');
const CurrencyBasics = requireFromRoot('src/helpers/CurrencyBasics.js');

class CapitalGainsCalculator {
    constructor() {
        this._currencyExchangeRateFetcher = new CurrencyExchangeRateFetcher();
    }

    async calculate(trades, cryptoExchangeRates) {
        const trackedAssets = new TrackedAssets();
        
        if (cryptoExchangeRates !== null) {
            const tradeLog = await calculateWithAdjustedBaseCost(this._currencyExchangeRateFetcher, cryptoExchangeRates, trades, trackedAssets);

            return {
                assets: trackedAssets.toArray(),
                tradeLog: tradeLog
            }
        } else {
            throw new Error('Error: exchange rates were not input in the expected format');
        }
    }
}

module.exports = CapitalGainsCalculator;