const config = require("../config.js");
const {createLogger, format, transports} = require("winston");

const logger = createLogger({
    format: format.combine(format.splat(), format.simple()),
    transports: [
        new transports.Console(config.logging.console),
        new transports.File(config.logging.file)
    ]
});

module.exports = logger;
