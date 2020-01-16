const { http, https } = require("follow-redirects"),
    // http = require("http"),
    httpProxy = require("http-proxy"),
    config = require("./config.js"),
    HttpsProxyAgent = require("https-proxy-agent"),
    url = require("url"),
    WebSocket = require("ws"),
    useHttpProxyWs = false,
    log = require("./lib/appLogger.js");

// Get server port from environment and store in Express.
const port = config.degraderPort;

// Setup proxy options
let proxyOptions = {
    //toProxy: toProxy,
    //selfHandleResponse: true,
    ws: true,
    //secure: false, // do not verify SSL cert
    xfwd: true,
    target: config.targetAppURL
};

// Front HTTP/HTTPS proxy to connect to (burp)
let frontProxyAgent = undefined;
let toProxy = false;
if (typeof config.frontProxy !== "undefined") {
    let frontProxyUrl = url.parse(config.frontProxy);
    log.info("Using front proxy server %s", config.frontProxy);
    frontProxyAgent = new HttpsProxyAgent(frontProxyUrl);
    proxyOptions.agent = frontProxyAgent;
}

// Setup our server to proxy standard HTTP requests
let proxy = new httpProxy.createProxyServer(proxyOptions);
//log.debug("Created proxy server with options: %s", JSON.stringify(proxyOptions));

// Create a server
//const server = http.createServer();
const server = http.createServer(function(req, res) {
    proxy.web(req, res);
});

if (!useHttpProxyWs) {
    const wss = new WebSocket.Server({ noServer: true });
    wss.on("open", function() {
        log.debug("WS open event");
    });
    wss.on("ping", function(data) {
        log.debug("WS ping event");
    });
    wss.on("pong", function(data) {
        log.debug("WS pong event");
    });
    wss.on("close", function() {
        log.debug("WS close event");
    });
    wss.on("error", function(error) {
        log.warn("WS error event");
    });
    wss.on("unexpected-response", function(req, res) {
        log.warn("WS error event");
    });
    wss.on("upgrade", function(res) {
        log.debug("WS upgrade event");
    });
    wss.on("connection", function connection(ws) {
        log.debug("WS connection event");

        // Open session with ws-upgrader REST API
        wsOpen();

        // Send message to ws-upgrader REST API
        ws.on("message", function(message) {
            log.debug("WS message event (%s): %s", typeof message, message);
            //ws.send(message.toUpperCase());
            wsSend(message, ws);
        });

        ws.on("response", function(res) {
            log.debug("WS responseevent");
        });

        // Close session with ws-upgrader REST API
        ws.on("close", function() {
            wsClose();
            log.debug("WS close event");
        });
    });

    // Handle the HTTP upgrade
    server.on("upgrade", function upgrade(request, socket, head) {
        log.debug("HTTP upgrade event");
        wss.handleUpgrade(request, socket, head, function done(ws) {
            log.debug("Emitting connection event");
            wss.emit("connection", ws, request);
        });
    });
}

// Listen to the upgrade event and proxy the WebSocket requests as well.
if (useHttpProxyWs) {
    server.on("upgrade", function(req, socket, head) {
        log.debug("Upgrade request event");
        proxy.ws(req, socket, head, function() {
            log.debug("Misc event");
        });
    });
}

// Listen for the error event on proxy.
// The error event is emitted if the request to the target fail. There is no error handling
// of messages passed between client and proxy, and messages passed between proxy and target, so
// it is recommended that you listen on errors and handle them.
proxy.on("error", function(err, req, res) {
    log.warn("Proxy error event");
    res.writeHead(500, {
        "Content-Type": "text/plain"
    });

    res.end("Something went wrong.");
});

server.listen(port);
log.info(
    "WebSocket Degrader Reverse Proxy Server at http://127.0.0.1:%s fronting the target app at %s",
    port,
    config.targetAppURL
);

// Upgrader config
const upgBasePath = "/websocket/";
const upgUriBase = "http://127.0.0.1:" + config.upgraderPort + upgBasePath;

function wsOpen() {
    let body = {};
    body.url = config.targetAppURL;
    sendHttpReq(upgUriBase + "open", "POST", body, undefined);
}

function wsSend(body, ws) {
    sendHttpReq(upgUriBase + "send", "POST", body, ws);
}

function wsClose() {
    let body = {};
    sendHttpReq(upgUriBase + "close", "POST", body, undefined);
}

function sendHttpReq(url, method, body, ws) {
    log.debug(
        "Sending %s request to %s with body %s",
        method,
        url,
        JSON.stringify(body)
    );
    let opts = {};
    opts.method = method;
    if (method === "POST")
        opts.headers = { "Content-Type": "application/json" };
    if (typeof frontProxyAgent !== "undefined") opts.agent = frontProxyAgent;

    let req = http.request(url, opts, function(res) {
        res.setEncoding("utf8");
        res.on("data", function(data) {
            log.debug("Response data: %s", data);
            if (typeof ws !== "undefined") {
                ws.send(data);
            }
        });
    });

    req.on("error", function(e) {
        log.error("problem with request: %s", e.message);
    });

    // write data to request body
    if (typeof body !== "undefined") req.write(JSON.stringify(body));
    req.end();
}
