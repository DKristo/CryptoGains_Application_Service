const CurrencyBasics = requireFromRoot('src/helpers/CurrencyBasics.js');
const timestampToDateString = requireFromRoot('src/helpers/TimestampToDateString.js');
    
function addCurrencyIfNeeded(exchangeRatesRequired, currency, timestamp) {
    if (!CurrencyBasics.isFiatCurrency(currency)) {
        if (!exchangeRatesRequired.hasOwnProperty(currency)) {
            exchangeRatesRequired[currency] = {};
        }

        const dateString = timestampToDateString(timestamp);

        exchangeRatesRequired[currency][dateString] = true;
    }
}

function convertExchangeRatesNeededToArray(exchangeRatesNeeded) {
    var result = [];
    
    for (var currency in exchangeRatesNeeded) {
        if (exchangeRatesNeeded.hasOwnProperty(currency)) {
            for (var date in exchangeRatesNeeded[currency]) {
                if (exchangeRatesNeeded[currency].hasOwnProperty(date)) {
                    result.push({
                        currency: currency,
                        date: date
                    });
                }
            }
        }
    }

    result.sort(function (a, b) {
        return (a.date === b.date) ? 0 : (a.date < b.date ? -1 : 1);
    });

    return result;
}

//Currently the user is required to input exchange rates for crypto currencies in USD for any crypto-to-crypto trades
//TODO: Find a free API that can be used to find historical exchange rates for crypto currencies to automate this
class ExchangeRatesRequiredFromUser {
    constructor() {
        this._exchangeRatesRequired = {}; //map by currency and date string
    }

    addTrade(trade) {
        //If the base or quote currency is in the native currency, we don't need the exchange rate for this pair
        if ((trade !== null) && (trade.baseCurrency !== CurrencyBasics.nativeCurrency()) && (trade.quoteCurrency !== CurrencyBasics.nativeCurrency())) {
            addCurrencyIfNeeded(this._exchangeRatesRequired, trade.quoteCurrency, trade.timestamp);
            addCurrencyIfNeeded(this._exchangeRatesRequired, trade.baseCurrency, trade.timestamp);
        }
    }

    result() {
        return convertExchangeRatesNeededToArray(this._exchangeRatesRequired);
    }
}

module.exports = ExchangeRatesRequiredFromUser;