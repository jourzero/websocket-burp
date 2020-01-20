const os = require("os");
const winston = require("winston");
const appRoot = require("app-root-path");
const appName = "websocket-burp";

const config = {
    appName: appName,

    /**************************************************************************************************
     Chaining: Browser --> ws-degrader --> [frontProxy] --> ws-upgrader --> [backProxy] --> Target App
    ***************************************************************************************************/
    // Server ports
    degraderPort: 8082,
    upgraderPort: 8083,
    testAppPort: 8084,
    dataDir: `${appRoot}/data`,
    saveLastBinaryResponse: false,

    // Optionally, configure logging (shouldn't be needed)
    logging: {
        file: {
            //format: winston.format.json(), // This format shouldn't cause CRLF issues
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.simple()
            ),
            level: "debug",
            handleExceptions: true,
            json: false,
            colorize: false,
            maxsize: 5242880, // 5MB
            maxFiles: 2,
            folder: `${appRoot}/logs/`,
            filename: `${appRoot}/logs/app.log`
        },
        console: {
            format: winston.format.combine(
                //winston.format.timestamp(),
                winston.format.colorize(),
                winston.format.simple()
            ),
            level: "debug",
            handleExceptions: true,
            json: false
        }
    }
};

module.exports = config;
