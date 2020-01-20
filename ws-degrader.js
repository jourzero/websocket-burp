const {http, https} = require("follow-redirects"),
    httpProxy = require("http-proxy"),
    config = require("./config.js"),
    HttpsProxyAgent = require("https-proxy-agent"),
    url = require("url"),
    WebSocket = require("ws"),
    useHttpProxyWs = false,
    log = require("./lib/appLogger.js");

// Get server port from environment or from config.js
const port = Number(process.env.WSD_PORT) || config.degraderPort;

// Get front HTTP proxy URL from environment
const httpFrontProxyURL = process.env.HTTP_PROXY_FRONT;

// Get target app URL from environment and validate it
const targetAppURL = process.env.TARGET_APP_URL;

if (typeof targetAppURL === undefined) {
    log.error("Target App URL is undefined, exiting immediately!");
    process.exit(1);
} else {
    let pu = url.parse(targetAppURL);
    if (pu.host === null || !pu.protocol.startsWith("http")) {
        log.error("Target App URL %s is invalid, exiting immediately!", targetAppURL);
        process.exit(2);
    } else {
        log.info("Target App URL: %s (valid)", targetAppURL);
    }
}

// Setup proxy options
let proxyOptions = {
    //secure: false, // do not verify SSL cert
    target: targetAppURL
};

// Front HTTP/HTTPS proxy to connect to (burp)
// TODO: check URL host, port, protocol
let frontProxyAgent;
if (typeof httpFrontProxyURL !== "undefined") {
    let frontProxyUrl = url.parse(httpFrontProxyURL);
    log.info("WSD: Using front proxy server %s", httpFrontProxyURL);
    frontProxyAgent = new HttpsProxyAgent(frontProxyUrl);
    proxyOptions.agent = frontProxyAgent;
}

// Setup our server to proxy standard HTTP requests
let proxy = new httpProxy.createProxyServer(proxyOptions);
log.debug("WSD: Created proxy server with options: %s", JSON.stringify(proxyOptions));

// Create a server
const server = http.createServer(function(req, res) {
    proxy.web(req, res);
});

if (!useHttpProxyWs) {
    const wss = new WebSocket.Server({noServer: true});
    //wss.on("open", function() { log.debug("WSD: WS open event"); });
    //wss.on("ping", function(data) { log.debug("WSD: WS ping event"); });
    //wss.on("pong", function(data) { log.debug("WSD: WS pong event"); });
    //wss.on("close", function() { log.debug("WSD: WS close event"); });
    //wss.on("error", function(error) { log.warn("WSD: WS error event"); });
    //wss.on("unexpected-response", function(req, res) { log.warn("WSD: WS error event"); });
    //wss.on("upgrade", function(res) { log.debug("WSD: WS upgrade event"); });
    wss.on("connection", function connection(ws) {
        log.debug("WSD: WS connection event");

        // Open session with ws-upgrader REST API
        wsOpen();

        // Send message to ws-upgrader REST API
        ws.on("message", function(message) {
            log.debug("WSD: WS message event (%s): %s", typeof message, message);
            wsSend(message, ws);
        });

        ws.on("response", function(res) {
            log.debug("WSD: WS responseevent");
        });

        // Close session with ws-upgrader REST API
        ws.on("close", function() {
            wsClose();
            log.debug("WSD: WS close event");
        });
    });

    // Handle the HTTP upgrade
    server.on("upgrade", function upgrade(request, socket, head) {
        log.debug("WSD: HTTP upgrade event");
        wss.handleUpgrade(request, socket, head, function done(ws) {
            log.debug("WSD: Emitting connection event");
            wss.emit("connection", ws, request);
        });
    });
}

// Listen to the upgrade event and proxy the WebSocket requests as well.
if (useHttpProxyWs) {
    server.on("upgrade", function(req, socket, head) {
        log.debug("WSD: Upgrade request event");
        proxy.ws(req, socket, head, function() {
            log.debug("WSD: Misc event");
        });
    });
}

// Listen for the error event on proxy.
// The error event is emitted if the request to the target fail. There is no error handling
// of messages passed between client and proxy, and messages passed between proxy and target, so
// it is recommended that you listen on errors and handle them.
proxy.on("error", function(err, req, res) {
    log.warn("WSD: Proxy error event");
    res.writeHead(500, {
        "Content-Type": "text/plain"
    });

    res.end("Something went wrong.");
});

server.listen(port);
log.info(
    "WSD: WebSocket Degrader Reverse Proxy Server at http://127.0.0.1:%s fronting the target app at %s",
    port,
    targetAppURL
);

// Upgrader config
const upgBasePath = "/ws/";
const upgUriBase = "http://127.0.0.1:" + config.upgraderPort + upgBasePath;

// Send request to ws-upgrader to open the WebSocket
function wsOpen() {
    let body = {};
    log.info("WSD: Sending WS open request to ws-upgrader");
    body.url = targetAppURL;
    sendHttpReq(upgUriBase + "open", "POST", body, null);
}

// Send request to ws-upgrader to send a message into the WebSocket
function wsSend(body, ws) {
    log.info("WSD: Sending WS message to ws-upgrader");
    log.info("WSD-OUT: %s", body);
    sendHttpReq(upgUriBase + "send", "POST", body, ws);
}

// Send request to ws-upgrader to close the WebSocket
function wsClose() {
    let body = {};
    log.info("WSD: Sending WS close request to ws-upgrader");
    sendHttpReq(upgUriBase + "close", "POST", body, null);
}

// Send an HTTP request.
// Particularities:
// - When there's response data, feed it back into the browser's websocket.
// - Supports HTTP redirects (needed by ws-upgrader) by using the "follow-redirects" module
function sendHttpReq(url, method, body, ws) {
    let bodyString = "";
    if (typeof body === "string") {
        bodyString = body;
    } else if (typeof body === "object") {
        bodyString = JSON.stringify(body);
    }
    log.debug("WSD: Sending %s request to %s with body %s", method, url, bodyString);
    let opts = {};
    opts.method = method;
    if (method === "POST") opts.headers = {"Content-Type": "application/json"};
    if (typeof frontProxyAgent !== "undefined") opts.agent = frontProxyAgent;

    let req = http.request(url, opts, function(res) {
        res.setEncoding("utf8");
        res.on("data", function(data) {
            log.info("WSD-IN: %s", data);
            if (typeof ws !== "undefined" && ws != null) {
                ws.send(data);
            }
        });
    });

    req.on("error", function(e) {
        log.error("WSD: Problem with request: %s", e.message);
    });

    // write data to request body
    if (bodyString !== "") req.write(bodyString);
    req.end();
}
