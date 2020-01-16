#!/usr/bin/env node
/* 
=====================================================================================
This is the entry point for the app. It starts-up a front-end websocket degrader
(ws-degrader.js) so that we can downgrade websocket traffic to HTTP and then later 
reupgrade it by using a REST API(in ws-upgrader.js). The upgrade app is based on 
ExpressJS and includes a test web app at /tester.html.

The whole reason to downgrade to HTTP is to be able to insert an HTTP fuzzer 
like Burp or OWASP ZAP in the loop for fuzzing purposes.

Lastly, an optional test websocket app (ws-test-app) is added to test the whole chain.
===================================================================================== 
*/
// Setup Logger and print start message
const config = require("./config.js");
const log = require("./lib/appLogger.js");
log.info("App %s is starting...", config.appName);

// Setup Dependencies for this Express App
const debug = require("debug")("express-tests:server");
const http = require("http");
const wsDegrader = require("./ws-degrader");
const app = require("./ws-upgrader"); // Express app
const testApp = require("./ws-test-app");

// Get port from environment and store in Express.
const port = config.upgraderPort;
app.set("port", port);

// Create HTTP server (for Express App)
const server = http.createServer(app);

// Listen on provided port, on all network interfaces.
server.listen(port);
server.on("error", onError);
server.on("listening", onListening);

// Print config
let appConfig = Object.assign({}, config);
appConfig.logging = "(not shown)";
log.debug("Config: %s", JSON.stringify(config, null, 2));
log.debug("App Config: %s", JSON.stringify(appConfig, null, 2));

// Normalize a port into a number, string, or false.
function normalizePort(val) {
    const port = parseInt(val, 10);

    if (isNaN(port)) {
        // named pipe
        return val;
    }

    if (port >= 0) {
        // port number
        return port;
    }

    return false;
}

// Event listener for HTTP server "error" event.
function onError(error) {
    if (error.syscall !== "listen") {
        throw error;
    }

    const bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case "EACCES":
            log.error(bind + " requires elevated privileges");
            process.exit(1);
            break;
        case "EADDRINUSE":
            log.error(bind + " is already in use");
            process.exit(1);
            break;
        default:
            throw error;
    }
}

// Event listener for HTTP server "listening" event.
function onListening() {
    const addr = server.address();
    const bind =
        typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
    log.info(
        "WebSocket Upgrader API Server started. API Tester at http://127.0.0.1:%s/tester.html",
        config.upgraderPort
    );
}
