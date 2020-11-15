const utils = require('./node/utils');

const mime = utils.lookupMime('app.exe');
console.log(mime);
