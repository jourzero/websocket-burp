const os = require("os");
const winston = require("winston");
const appRoot = require("app-root-path");
const appName = "ws-proxy";

const config = {
    appName: appName,

    /**************************************************************************************************
     Chaining: Browser --> ws-degrader --> [frontProxy] --> ws-upgrader --> [backProxy] --> Target App
    ***************************************************************************************************/
    // Server ports
    degraderPort: 8082,
    upgraderPort: 8083,
    testAppPort: 8084,

    // Optionally, configure logging (shouldn't be needed)
    logging: {
        file: {
            format: winston.format.json(), // This format shouldn't cause CRLF issues
            level: "info",
            handleExceptions: true,
            json: true,
            colorize: false,
            maxsize: 5242880, // 5MB
            maxFiles: 2,
            folder: `${appRoot}/logs/`,
            filename: `${appRoot}/logs/app.log`
        },
        console: {
            format: winston.format.simple(),
            level: "debug",
            handleExceptions: true,
            json: false,
            colorize: true
        }
    }
};

module.exports = config;
