const processFileUpload = requireFromRoot('src/file_import/ProcessFileUpload.js');
const objectIdFromString = requireFromRoot('src/database/helpers/ObjectIdFromString.js');

module.exports = (database, router) => {
    //Creates a source for a specific user
    router.post('/api/users/:user_id/sources', async (req, res) => {
        const userId = objectIdFromString(req.params.user_id);
        const parsedTradesResult = await processFileUpload(req, res);

        if (parsedTradesResult !== null && parsedTradesResult.data) {
            const result = await database.modules.tradesSource.create(userId, parsedTradesResult.data);
            res.status(result ? 200 : 403).end();
        } else {
            res.status(403).end();
        }
    });


    //Deletes a source for a specific user
    router.delete('/api/users/:user_id/sources/:source_id', (req, res) => {
        //TODO: Implement
        res.status(501).end();
    });
}