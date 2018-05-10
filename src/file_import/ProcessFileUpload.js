const fs = require('fs');
const multer = require('multer');
const net = require('net');
const promisify = require('util').promisify;
const configuration = JSON.parse(fs.readFileSync(global.globalRootDirectory + '/configuration.json'));

const uploadify = promisify(multer({
    limits: { fileSize: configuration.upload.maxFileSize },
    dest: global.globalRootDirectory + '/' + configuration.upload.directory
}).array('uploadedFiles', configuration.upload.maxNumberOfFiles));

function unlinkUploadedFile(path) {
    return new Promise(resolve => {
        fs.stat(path, (statErr, stat) => {
            if (!statErr && stat) {
                fs.unlink(path, () => {
                    resolve();
                });
            } else {
                resolve();
            }
        });
    });
}

async function sendFileToParserService(temporaryFilePath, fileName, fileSizeInBytes) {
    const fileStream = fs.createReadStream(temporaryFilePath);

    return await new Promise(resolve => {
        const socket = new net.Socket();
        var assembledData = '';

        socket.on('data', (data) => {
            assembledData += data;
        });

        socket.on('end', () => {
            var importResult = null;

            try {
                importResult = JSON.parse(assembledData);
            } catch (e) {
                resolve({ error: 'There was a problem' });
                return;
            }

            if (!importResult) {
                resolve({ error: 'There was a problem' });
                return;
            }

            resolve(importResult);
        });

        socket.on('error', (err) => {
            resolve({ error: 'There was a problem' });
        });

        socket.connect(configuration.parserServiceEndpoint.port, configuration.parserServiceEndpoint.ip, () => {
            const fileNameSize = Buffer.byteLength(fileName, 'utf8');
            const headerSize = 8 + 2 + fileNameSize;
            const headerBuffer = new Buffer(headerSize);
            headerBuffer.writeDoubleBE(fileSizeInBytes, 0);
            headerBuffer.writeInt16BE(fileNameSize, 8);
            headerBuffer.write(fileName, 10);

            socket.write(headerBuffer);
            
            fileStream.pipe(socket, { end: false });
        });
    });
}

module.exports = async function (req, res) {
    await uploadify(req, res);

    if (req.files && req.files.length === 1) {
        const file = req.files[0];

        const parsedData = await sendFileToParserService(file.path, file.originalname, file.size);
        await unlinkUploadedFile(file.path);

        return parsedData;
    }

    return null;
}