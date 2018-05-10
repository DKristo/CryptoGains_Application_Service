const moment = require('moment');

module.exports = function (timestamp) {
    return moment(timestamp).format('YYYY-MM-DD');
};