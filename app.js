"use strict";
const createError = require("http-errors"),
    express = require("express"),
    fs = require("fs"),
    hbs = require("hbs"),
    path = require("path"),
    cookieParser = require("cookie-parser"),
    reqLogger = require("./lib/reqLogger.js"),
    logger = require("./lib/appLogger.js"),
    format = require("util").format,
    app = express(),
    http = require("http"),
    WebSocket = require("ws"),
    url = require("url"),
    HttpsProxyAgent = require("https-proxy-agent"),
    bodyParser = require("body-parser"),
    config = require("./config.js");

// Get Logger
logger.info(format("App %s is starting...", config.appName));

// HTTP/HTTPS proxy to connect to
//let wssProxyUrl = url.parse(config.wssProxy);
//logger.info("Using websocket proxy server " + JSON.stringify(wssProxyUrl));
//let wssProxyAgent = new HttpsProxyAgent(wssProxyUrl);

// Create logs directory
/*
try {
    fs.mkdirSync(config.logging.file.folder, (err, folder) => {
        if (err) logger.error("Error trying to create " + folder + ": " + err.message);
        logger.debug("Created folder %s", folder);
    });
} catch (err) {
    logger.error("Exception trying to create " + config.logging.file.folder + ": " + err.message);
}
*/

// Use my request logger
app.use(reqLogger);

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");
hbs.registerPartials(path.join(__dirname, "views/partials"));

//app.use(logger('dev'));
app.use(cookieParser());
// Don't use body parser to get full control of body parsing (by commenting-out the following line)
//app.use(express.json({type: "application/json", strict: false, limit: "5mb"}));
app.use(express.static(path.join(__dirname, "public")));

app.use(bodyParser.text({inflate: true, limit: "1mb", type: "*/*"}));

//Process request to open the websocket
let ws = undefined;
let wsStatus = "Closed";
let wsMsgReceived = 0;
let wsMsgSent = 0;
let wsMessageQueue = [];

app.post("/websocket/open", (req, res) => {
    let body = req.body;
    if (typeof body === "string") body = JSON.parse(req.body);
    logger.info("Websocket open for %s", body.url);
    //ws = new WebSocket(body.url, {agent: wssProxyAgent});
    ws = new WebSocket(body.url);

    ws.on("open", function(message) {
        logger.info("Websocket open confirmed");
        wsStatus = "Open";
        wsMsgSent = 0;
        wsMsgReceived = 0;
    });

    ws.on("message", function(message) {
        logger.info("Websocket message received: %s", message);
        wsMessageQueue.push(message);
        wsMsgReceived++;
        wsStatus = "Open";
        logMessage(message);
    });

    ws.on("close", function(code) {
        logger.info("Websocket close confirmed. Code: " + code);
        wsStatus = "Closed";
    });

    ws.on("error", function(error) {
        logger.error("WebSocket Error: " + error.code);
        wsStatus = "Error";
    });
    res.type("json");
    res.status(201).json({op: "open"});
});

//Process send a message in the websocket
app.post("/websocket/send", (req, res) => {
    let body = req.body;
    if (typeof req.body === "object") body = JSON.stringify(req.body);
    logger.info("Websocket message sent: %s", body);
    wsMsgSent++;
    ws.send(body);
    logMessage(body);
    /*
    if (wsMessageQueue.length > 0) {
        res.type('json');
        res.status(201).json(wsMessageQueue.shift());
    } else {
        res.type('json');
        res.status(201).json({});
    }
    */
    res.redirect("/websocket/receive");
});

//Process request to check the websocket
app.get("/websocket/check", (req, res) => {
    logger.info("Checking websocket status.");
    res.type("json");
    res.status(200).json({op: "check", status: wsStatus});
    logger.info("Status: " + wsStatus);
});

//Process request to check the websocket
app.get("/websocket/stats", (req, res) => {
    logger.info("Getting websocket stats.");
    let stats = {};
    stats.op = "stats";
    stats.received = wsMsgReceived;
    stats.sent = wsMsgSent;
    stats.queued = wsMessageQueue.length;
    res.type("json");
    res.status(200).json(stats);
    logger.info("Stats: " + JSON.stringify(stats));
});

//Process request to dequeue one message saved from the websocket
app.get("/websocket/receive", (req, res) => {
    if (wsMessageQueue.length > 0) {
        let msg = wsMessageQueue.shift();
        logger.info("Receiving queued message: %s", msg);
        logMessage(msg);
        res.type("json");
        res.status(200).send(msg);
    } else {
        res.type("json");
        res.status(204).send({});
    }
});

//Process request to dequeue data saved from the websocket
app.get("/websocket/dequeue", (req, res) => {
    logger.info("Dequeueing websocket data.");
    if (wsMessageQueue.length > 0) {
        res.status(200).send(wsMessageQueue);
    } else {
        res.type("json");
        res.status(204).send({});
    }
    wsMessageQueue = [];
});

//Process request to close the websocket
app.post("/websocket/close", (req, res) => {
    logger.info("Closing websocket.");
    ws.close();
    res.sendStatus(200);
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    logger.error(`UNKNOWN ROUTE ${req.originalUrl}`);
    //next(createError(404));
    res.status(404).send("NOT FOUND");
    // render the error page
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};
    logger.error(`GENERAL ERROR! URL:${req.originalUrl}\nERROR:${err.message}\nSTACK:${err.stack}`);

    // render the error page
    res.status(err.status || 500);
    res.render("error");
});
module.exports = app;

function logMessage(msg) {
    if (typeof msg == "string") {
        fs.appendFile(config.logging.file.folder + "messages.json", msg + "\n", err => {
            if (err) throw err;
        });
    } else {
        fs.appendFile(config.logging.file.folder + "messages.json", msg.toString() + "\n", err => {
            if (err) throw err;
        });
    }
}
