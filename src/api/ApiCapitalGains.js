const CapitalGainsCalculator = requireFromRoot('src/CapitalGainsCalculator.js');
const ExchangeRatesRequiredFromUser = requireFromRoot('src/currency_exchange_rates/ExchangeRatesRequiredFromUser.js');
const objectIdFromString = requireFromRoot('src/database/helpers/ObjectIdFromString.js');

module.exports = (database, router) => {
    const capitalGainsCalculator = new CapitalGainsCalculator();

    //Creates a new calculation job
    router.post('/api/users/:user_id/capital-gains', async (req, res) => {
        const userId = objectIdFromString(req.params.user_id);
        
        const allTrades = await database.modules.tradesSource.getAllTradesByUserId(userId);
        const exchangeRatesRequiredFromUser = new ExchangeRatesRequiredFromUser();

        for (var i = 0; i < allTrades.length; ++i) {
            exchangeRatesRequiredFromUser.addTrade(allTrades[i]);
        }

        const job = await database.modules.capitalGainsCalculation.create(userId);

        res.status(200).json({ 
            job: job,
            exchangeRatesRequired: exchangeRatesRequiredFromUser.result()
        });
    });

    //Updates a calculation job
    router.post('/api/users/:user_id/capital-gains/:job_id', async (req, res) => {
        const userId = objectIdFromString(req.params.user_id);
        const jobId = objectIdFromString(req.params.job_id);

        const job = await database.modules.capitalGainsCalculation.findById(jobId);

        if (job) {
            res.status(200).end();

            const allTrades = await database.modules.tradesSource.getAllTradesByUserId(userId);

            var result = null;

            try {
                result = await capitalGainsCalculator.calculate(allTrades, req.body.exchangeRates || {});
            } catch (err) {
                result = { error: err.toString() };
            }

            await database.modules.capitalGainsCalculation.setResult(jobId, result);
        } else {
            res.status(404).end();
        }
    });

    //Returns a calculation job
    router.get('/api/users/:user_id/capital-gains/:job_id', async (req, res) => {
        const userId = objectIdFromString(req.params.user_id);
        const jobId = objectIdFromString(req.params.job_id);

        const job = await database.modules.capitalGainsCalculation.findById(jobId);

        if (job) {
            res.status(200).json(job);
        } else {
            res.status(404).end();
        }
    });

    return router;
}