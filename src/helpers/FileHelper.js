const promisify = require('util').promisify;
const readdir = promisify(require('fs').readdir);
const lstat = promisify(require('fs').lstat);

module.exports = {
    getAllFilePathsRecursively: async function (rootPath) {
        var allFiles = [];

        async function recurse(path) {
            const filenames = await readdir(path);
    
            for (var i = 0; i < filenames.length; ++i) {
                const filePath = path + '/' + filenames[i];

                const stats = await lstat(filePath);

                if (stats.isDirectory()) {
                    await recurse(filePath);
                } else {
                    allFiles.push(filePath);
                }
            }
        }

        await recurse(rootPath);

        return allFiles;
    }
}