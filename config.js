const os = require("os");
const winston = require("winston");
const appRoot = require("app-root-path");
const appName = "ws-proxy";

const config = {
    appName: appName,

    /*************************************************************************************************
     Chaining: Browser --> ws-degrader --> [frontProxy] --> ws-upgrader --> [backProxy] --> Target App

     To test the whole chain with the App being the Test App, use these values (in steps 1-6):
        degraderPort    8082
        upgraderPort    8083
        targetAppURL    http://127.0.0.1:8084
        testAppPort     8084
    *************************************************************************************************/

    // Step 1. Configure the ws-degrader listener if needed
    degraderPort: 8082,

    // Step 2. Configure the frontProxy
    // Uncomment/adjust frontProxy if you want to insert Burp at the front (behind the degrader).
    //frontProxy: "http://192.168.9.125:8081", //W
    frontProxy: "http://192.168.9.106:8081", //H

    // Step 3. Configure the ws-upgrader
    upgraderPort: 8083,

    // Step 4. Configure the backProxy
    // Uncomment/adjust backProxy if you want to insert Burp in the back (before the Target)
    //backProxy: "http://192.168.9.125:8081", // W
    backProxy: "http://192.168.9.106:8081", // H

    // Step 5. Configure the App
    // Test App URL (port has to match config in #6). Echoes websocket data after conversion of all chars to uppercase.
    targetAppURL: "http://127.0.0.1:8084",
    targetAppWsURL: "ws://127.0.0.1:8084",
    // External test app to echo websocket data:
    //targetAppURL: "http://echo.websocket.org",

    // Step 6. For testing, configure the Test App
    // Uncomment testAppPort if you want to test with the test app (needs to match the config in #5)
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
