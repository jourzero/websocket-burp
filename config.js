const os = require("os");
const winston = require("winston");
const appRoot = require("app-root-path");
const appName = "ws-proxy";

const config = {
    appName: appName,
    // Uncomment wssProxy if you want to insert Burp in front of the app to capture websocket data
    //backProxy: "http://192.168.9.125:8081",
    //backProxy: "http://192.168.9.106:8081",
    appURL: "http://localhost:8084",
    //appURL: "http://echo.websocket.org",
    sampleAppPort: 8084,
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
        },
        syslog: {
            app_name: appName, // The name of the application (Default: process.title).
            format: winston.format.json(),
            level: "info",
            host: "syslog.local", // The host running syslogd, defaults to localhost.
            port: "514", // The port on the host that syslog is running on, defaults to syslogd's default port.
            protocol: "udp4", // The network protocol to log over (e.g. tcp4, udp4, unix, unix-connect, etc).
            localhost: os.hostname(), // Host to indicate that log messages are coming from (Default: localhost).
            path: "/dev/log", // The path to the syslog dgram socket (i.e. /dev/log or /var/run/syslog for OS X).
            facility: "local0", // Syslog facility to use (Default: local0).
            type: "BSD", // The type of the syslog protocol to use (Default: BSD, also valid: 5424).
            pid: process.pid // PID of the process that log messages are coming from (Default process.pid).
            //eol      : "\0"                // The end of line character to be added to the end of the message (Default: Message without modifications).
        }
    }
};

module.exports = config;
