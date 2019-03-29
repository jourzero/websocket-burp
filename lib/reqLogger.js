// Setup request logging
const morgan = require("morgan");
const fs = require("fs");
const config = require("../config.js");
//const path   = require('path');

// create a write stream (in append mode)
//const accessLogStream = fs.createWriteStream(path.join(__dirname, 'logs/access.log'), { flags: 'a' })
const accessLogStream = fs.createWriteStream(config.logging.file.folder + "access.log", {
    flags: "a"
});

// Save combined log. Ref.: https://github.com/expressjs/morgan
module.exports = morgan("combined", {stream: accessLogStream});
