const timestampToDateString = requireFromRoot('src/helpers/TimestampToDateString.js');
const newTradeEntry = requireFromRoot('src/model/TradeEntry.js');
const CurrencyBasics = requireFromRoot('src/helpers/CurrencyBasics.js');

//Assumes quote currency is the native currency which is always the case after expanding trades
//transactionFee is in native currency
function calculateAdjustedCostBaseAfterBuyTransaction(previousAdjustedCostBase, previousNumberOfShares, numberOfSharesBought, unitPrice, transactionFee) {
    return {
        newAdjustedCostBase: previousAdjustedCostBase + (numberOfSharesBought * unitPrice) + transactionFee
    };
}

//Assumes quote currency is the native currency which is always the case after expanding trades
//transactionFee is in native currency
function calculateAdjustedCostBaseAfterSellTransaction(previousAdjustedCostBase, previousNumberOfShares, numberOfSharesSold, unitPrice, transactionFee) {
    if (previousNumberOfShares === 0) {
        //Attempt to sell an asset that was never bought
        //Treat it as if the asset was obtained for free
        return {
            newAdjustedCostBase: 0,
            capitalGain: (numberOfSharesSold * unitPrice) - transactionFee
        };
    }

    return {
        newAdjustedCostBase: previousAdjustedCostBase * ((previousNumberOfShares - numberOfSharesSold) / previousNumberOfShares),
        capitalGain: (numberOfSharesSold * unitPrice) - transactionFee - ((previousAdjustedCostBase / previousNumberOfShares) * numberOfSharesSold)
    };
}

//Expands a trade into 2 separate trades if the trade isn't quoted in the native currency
function expandTrade(trade, baseToNativeExchangeRate, quoteToNativeExchangeRate) {
    if (trade.type === 'buy') {
        return [
            newTradeEntry(
                trade.quoteCurrency,
                CurrencyBasics.nativeCurrency(),
                'sell', quoteToNativeExchangeRate,
                trade.volume * trade.unitPrice,
                null,
                trade.timestamp,
                trade.source
            ),
            newTradeEntry(
                trade.baseCurrency,
                CurrencyBasics.nativeCurrency(),
                'buy',
                baseToNativeExchangeRate,
                trade.volume,
                {
                    fee: trade.fee.fee,
                    currency: trade.fee.currency
                },   
                trade.timestamp,
                trade.source
            )
        ];
    } else if (trade.type === 'sell') {
        return [
            newTradeEntry(
                trade.baseCurrency,
                CurrencyBasics.nativeCurrency(),
                'sell',
                baseToNativeExchangeRate,
                trade.volume,
                {
                    fee: trade.fee.fee,
                    currency: trade.fee.currency
                },
                trade.timestamp,
                trade.source
            ),
            newTradeEntry(
                trade.quoteCurrency,
                CurrencyBasics.nativeCurrency(),
                'buy',
                quoteToNativeExchangeRate,
                trade.volume * trade.unitPrice,
                null,
                trade.timestamp,
                trade.source
            )
        ];
    }

    return [];
}

module.exports = async function (currencyExchangeRateFetcher, cryptoExchangeRates, trades, trackedAssets) {    
    async function resolveExchangeRate(currency, tradeDateString) {
        if (CurrencyBasics.isFiatCurrency(currency)) {
            return await currencyExchangeRateFetcher.getExchangeRate(currency, CurrencyBasics.nativeCurrency(), tradeDateString);
        } else if ((cryptoExchangeRates.hasOwnProperty(currency)) && (cryptoExchangeRates[currency].hasOwnProperty(tradeDateString))) {
            return cryptoExchangeRates[currency][tradeDateString];
        }

        return null;
    }

    async function prepareExpandedTrade(trade) {
        if (trade.quoteCurrency === CurrencyBasics.nativeCurrency()) {
            return [trade];
        }

        const tradeDateString = timestampToDateString(trade.timestamp);
        const baseToNativeExchangeRate = await resolveExchangeRate(trade.baseCurrency, tradeDateString);
        const quoteToNativeExchangeRate = await resolveExchangeRate(trade.quoteCurrency, tradeDateString);


        if ((baseToNativeExchangeRate === null) || (quoteToNativeExchangeRate === null)) {
            throw new Error('Error: exchange rate is null');
        }

        return expandTrade(trade, baseToNativeExchangeRate, quoteToNativeExchangeRate);
    }

    async function processTrade(trade) {
        const expandedTrade = await prepareExpandedTrade(trade);

        var result = [];

        for (var i = 0; i < expandedTrade.length; ++i) {
            const halfTrade = expandedTrade[i];

            const asset = trackedAssets.ensureTracked(halfTrade.baseCurrency);
            const nativeCurrencyAsset = trackedAssets.ensureTracked(CurrencyBasics.nativeCurrency());

            const feeInNativeCurrency = (halfTrade.fee === null) ? 0 : (halfTrade.fee.fee * await resolveExchangeRate(halfTrade.fee.currency, timestampToDateString(halfTrade.timestamp)));

            if (halfTrade.type === 'buy') {
                const resultOfTrade = calculateAdjustedCostBaseAfterBuyTransaction(asset.adjustedCostBase, asset.numberOfShares, halfTrade.volume, halfTrade.unitPrice, feeInNativeCurrency);
                asset.adjustedCostBase = resultOfTrade.newAdjustedCostBase;
                asset.numberOfShares += halfTrade.volume;
                nativeCurrencyAsset.numberOfShares -= (halfTrade.volume * halfTrade.unitPrice);
    
                result.push({ trade: halfTrade, capitalGain: null });
            } else if (halfTrade.type === 'sell') {
                const resultOfTrade = calculateAdjustedCostBaseAfterSellTransaction(asset.adjustedCostBase, asset.numberOfShares, halfTrade.volume, halfTrade.unitPrice, feeInNativeCurrency);
                asset.adjustedCostBase = resultOfTrade.newAdjustedCostBase;
                asset.numberOfShares -= halfTrade.volume;
                nativeCurrencyAsset.numberOfShares += (halfTrade.volume * halfTrade.unitPrice);
    
                result.push({ trade: halfTrade, capitalGain: resultOfTrade.capitalGain });
            }

            if (halfTrade.fee !== null) {
                const assetOfTransactionFee = trackedAssets.ensureTracked(halfTrade.fee.currency);
                assetOfTransactionFee.numberOfShares -= halfTrade.fee.fee;
            }
        }

        return result;
    }

    var tradeLog = [];

    function logTrade(tradeResult) {
        for (var i = 0; i < tradeResult.length; ++i) {
            tradeLog.push(tradeResult[i]);
        }
    }

    for (var i = 0; i < trades.length; ++i) {
        const trade = trades[i];

        if (trade !== null) {
            try {
                const tradeResult = await processTrade(trade);
                logTrade(tradeResult);
            } catch (err) {
                console.log(err);
            }
        }
    }

    return tradeLog;
}