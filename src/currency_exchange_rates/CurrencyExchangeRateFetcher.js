const https = require('https');

function fetchExchangeRatesWithFixerApi(base, dateString) {
    return new Promise(resolve => {
        const requestOptions = {
            host: 'api.fixer.io',
            path: '/' + dateString + '?base=' + base,
            method: 'GET'
        };

        var myRequest = https.request(requestOptions, function (myResponse) {
            myResponse.setEncoding('utf-8');
            var responseString = '';

            myResponse.on('end', function () {            
                try {
                    const result = JSON.parse(responseString);
                    resolve(result);
                } catch (err) {
                    resolve({ error: 'Failed to parse response' });
                }
            });

            myResponse.on('data', function (data) {
                responseString += data;
            });
        });
    
        myRequest.on('error', function (err) {
            resolve({ error: 'Error making request' });
        });
    
        myRequest.end();
    });
}

function dateToString(date) {
    return date.year + '-' + (date.month < 10 ? ('0' + date.month) : date.month) + '-' + (date.day < 10 ? ('0' + date.day) : date.day);
}

//TODO: Move caching of exchange rates from memory to database
class CurrencyExchangeRateFetcher {
    constructor() {
        this._baseCurrencyForConversions = 'USD';
        this._cachedExchangeRates = {};
    }

    async getExchangeRate(base, quote, dateString) {
        if (base === quote) {
            return 1.0; //No need for a lookup, it's the same currency
        }

        if (!this._cachedExchangeRates.hasOwnProperty(dateString)) {
            this._cachedExchangeRates[dateString] = await fetchExchangeRatesWithFixerApi(this._baseCurrencyForConversions, dateString);
        }

        const exchangeRates = this._cachedExchangeRates[dateString];

        if (exchangeRates.error) {
            return null;
        }

        if (!exchangeRates.rates.hasOwnProperty(quote)) {
            return null;
        }

        if (base === this._baseCurrencyForConversions) {
            //If the base currency is USD no extra conversions need to be done
            return exchangeRates.rates[quote];
        } else if (exchangeRates.rates.hasOwnProperty(base)) {
            //If the base currency is not USD but it is a supported currency we can do the conversion
            const usdToBase = exchangeRates.rates[base];
            const usdToQuote = exchangeRates.rates[quote];

            return (1.0 / usdToBase) * usdToQuote;
        }

        return null;
    }
}

module.exports = CurrencyExchangeRateFetcher;