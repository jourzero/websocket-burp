"use strict";
const createError = require("http-errors"),
    express = require("express"),
    fs = require("fs"),
    //hbs = require("hbs"),
    path = require("path"),
    cookieParser = require("cookie-parser"),
    reqLogger = require("./lib/reqLogger.js"),
    log = require("./lib/appLogger.js"),
    format = require("util").format,
    app = express(),
    http = require("http"),
    WebSocket = require("ws"),
    url = require("url"),
    HttpsProxyAgent = require("https-proxy-agent"),
    bodyParser = require("body-parser"),
    config = require("./config.js");

// Get back HTTP proxy URL from environment
const httpBackProxyURL = process.env.HTTP_PROXY_BACK;

// HTTP/HTTPS proxy to connect to
// TODO: check URL host, port, protocol
let backProxyAgent;
if (typeof httpBackProxyURL !== "undefined") {
    let backProxyUrl = url.parse(httpBackProxyURL);
    log.info("WSU: Using back proxy server %s", httpBackProxyURL);
    backProxyAgent = new HttpsProxyAgent(backProxyUrl);
}

// Create logs directory
/*
try {
    fs.mkdirSync(config.logging.file.folder, (err, folder) => {
        if (err) log.error("WSU: Error trying to create " + folder + ": " + err.message);
        log.debug("WSU: Created folder %s", folder);
    });
} catch (err) {
    log.error("WSU: Exception trying to create " + config.logging.file.folder + ": " + err.message);
}
*/

// Use my request log
app.use(reqLogger);

// view engine setup
//app.set("views", path.join(__dirname, "views"));
//app.set("view engine", "hbs");
//hbs.registerPartials(path.join(__dirname, "views/partials"));
//
//app.use(log("dev"));
app.use(cookieParser());
// Don't use body parser to get full control of body parsing (by commenting-out the following line)
app.use(express.json({type: "application/json", strict: false, limit: "5mb"}));
app.use(express.static(path.join(__dirname, "public")));
app.use("/fonts", express.static(path.join(__dirname, "node_modules/bootstrap/dist/fonts")));
app.use("/bootstrap", express.static(path.join(__dirname, "node_modules/bootstrap/dist")));
app.use("/jquery", express.static(path.join(__dirname, "node_modules/jquery/dist")));

app.use(bodyParser.text({inflate: true, limit: "1mb", type: "text/html"}));
app.use(
    bodyParser.json({
        inflate: true,
        limit: "1mb",
        strict: true,
        type: "application/json"
    })
);

// Disable caching
app.disable("etag");
app.use((req, res, next) => {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    next();
});

//Process request to open the websocket
let ws;
let wsStatus = "Closed";
let wsMsgReceived = 0;
let wsMsgSent = 0;
let wsMessageQueue = [];
let wsQueueing = false;

app.post("/ws/open", (req, res) => {
    let body = req.body;
    if (typeof body === "string") body = JSON.parse(req.body);
    log.info("WSU: Websocket open for %s with queueing=%s", body.url, body.queueing);
    wsQueueing = body.queueing;
    if (typeof backProxyAgent !== "undefined")
        ws = new WebSocket(body.url, {agent: backProxyAgent});
    else ws = new WebSocket(body.url);

    ws.on("open", function(message) {
        log.info("WSU: Websocket open confirmed");
        wsStatus = "Open";
        wsMsgSent = 0;
        wsMsgReceived = 0;
    });

    ws.on("message", function(message) {
        log.debug("WSU: Queuing incoming websocket data of type: %s", typeof message);
        if (typeof message === "string") log.info("WSU-IN: %s", message);
        wsMessageQueue.push(message);
        wsMsgReceived++;
        wsStatus = "Open";
        logMessage(message);
    });

    ws.on("close", function(code) {
        log.info("WSU: Websocket close confirmed. Code: " + code);
        wsStatus = "Closed";
    });

    ws.on("error", function(error) {
        log.error("WSU: WebSocket Error: " + error.code);
        wsStatus = "Error";
    });
    res.type("json");
    res.status(201).json({op: "open"});
});

//Process send a message in the websocket
app.post("/ws/send", (req, res) => {
    if (wsStatus != "Open") {
        log.info("WSU: Cannot send to Websocket: %s", wsStatus);
        res.type("json");
        res.status(404).json({status: wsStatus});
    } else {
        let body = req.body;
        if (typeof req.body === "object") {
            log.debug("WSU: Stringifying body prior to socket insertion");
            body = JSON.stringify(req.body);
        }
        log.debug("WSU: Websocket message sent");
        log.info("WSU-OUT: %s", body);
        wsMsgSent++;
        ws.send(body);
        logMessage(body);
        if (wsQueueing) {
            res.type("json");
            res.status(201).json({});
        } else {
            res.redirect("/ws/receive");
        }
    }
});

//Process request to check the websocket
app.get("/ws/check", (req, res) => {
    log.info("WSU: Checking websocket status.");
    res.type("json");
    res.status(200).json({op: "check", status: wsStatus});
    log.info("WSU: Status: " + wsStatus);
});

//Process request to check the websocket
app.get("/ws/stats", (req, res) => {
    log.info("WSU: Getting websocket stats.");
    let stats = {};
    stats.op = "stats";
    stats.received = wsMsgReceived;
    stats.sent = wsMsgSent;
    stats.queued = wsMessageQueue.length;
    res.type("json");
    res.status(200).json(stats);
    log.info("WSU: Stats: " + JSON.stringify(stats));
});

//Process request to dequeue one message saved from the websocket
app.get("/ws/receive", (req, res) => {
    if (wsStatus != "Open") {
        log.info("WSU: Cannot receive from Websocket: %s", wsStatus);
        res.type("json");
        res.status(404).json({status: wsStatus});
    } else {
        if (wsMessageQueue.length > 0) {
            let msg = wsMessageQueue.shift();
            log.info("WSU: Dequeueing message of type %s", typeof msg);
            if (typeof msg === "string") {
                log.info("WSU: Message: %s", msg);
                res.type("json");
                logMessage(msg);
                res.status(200).send(msg);
            } else if (typeof msg === "object") {
                //res.type("application/octet-stream");
                res.status(200).send(Buffer.from(msg));
            }
        } else {
            log.debug("WSU: No more received message (in queue)");
            res.type("json");
            res.status(204).send({});
        }
    }
});

//Process request to close the websocket
app.post("/ws/close", (req, res) => {
    if (wsStatus != "Open") {
        log.info("WSU: Cannot send to Websocket: %s", wsStatus);
        res.type("json");
        res.status(404).json({status: wsStatus});
    } else {
        log.info("WSU: Closing websocket.");
        ws.close();
        res.type("json");
        res.status(200).json({});
    }
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    log.error(`WSU: UNKNOWN ROUTE ${req.originalUrl}`);
    //next(createError(404));
    res.type("json");
    res.status(404).json({status: "NOT FOUND"});
    // render the error page
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};
    log.error(
        `WSU: GENERAL ERROR! URL:${req.originalUrl}\nERROR:${err.message}\nSTACK:${err.stack}`
    );

    // render the error page
    res.status(err.status || 500);
    res.send({
        message: err.message,
        error: err
    });
    return;
});

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
module.exports = app;
