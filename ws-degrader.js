const http = require("http"),
    httpProxy = require("http-proxy"),
    config = require("./config.js"),
    HttpsProxyAgent = require("https-proxy-agent"),
    url = require("url"),
    logger = require("./lib/appLogger.js");

// Get server port from environment and store in Express.
const port = config.degraderPort;

// Front HTTP/HTTPS proxy to connect to (burp)
let frontProxyAgent = undefined;
if (typeof config.frontProxy !== "undefined") {
    let frontProxyUrl = url.parse(config.frontProxy);
    logger.info("Using front proxy server " + JSON.stringify(frontProxyUrl));
    frontProxyAgent = new HttpsProxyAgent(frontProxyUrl);
}

// Setup our server to proxy standard HTTP requests
let proxy = new httpProxy.createServer({
    target: config.appURL,
    agent: frontProxyAgent,
    selfHandleResponse: true,
    ws: true
}).listen(port);
/*
let proxyServer = http.createServer(function(req, res) {
    proxy.web(req, res);
});

// Listen to the `upgrade` event
proxyServer.on("upgrade", function(req, socket, head) {
    logger.debug("Upgrade requested");

    // Open WebSocket on upgrader service
    //wsOpen();
    //logger.debug("Request Details: %s", JSON.stringify(req, null, 2));

    // proxy the WebSocket requests as well.
    proxy.ws(req, socket, head);
});
proxyServer.on("listening", onListening);
*/

proxy.on("listening", function onListening() {
    console.debug("WebSocket Degrader Proxy Server listening on " + port);
});

proxy.on("proxyReq", function(proxyReq, req, res, options) {
    //proxyReq.setHeader("X-Special-Proxy-Header", "foobar");
    //logger.debug("RAW Request to proxy: %s", proxyReq.headers);
    //logger.debug("RAW Request : %s", JSON.stringify(req.headers));
    logger.debug("Proxy Request for %s%s", req.headers.host, req.url);
});

// Listen for the `error` event on `proxy`.
// The error event is emitted if the request to the target fail. There is no error handling
// of messages passed between client and proxy, and messages passed between proxy and target, so
// it is recommended that you listen on errors and handle them.
proxy.on("error", function(err, req, res) {
    res.writeHead(500, {
        "Content-Type": "text/plain"
    });

    res.end("Something went wrong. And we are reporting a custom error message.");
});

// Listen for the `proxyRes` event on `proxy`.
proxy.on("proxyRes", function(proxyRes, req, res) {
    logger.debug("RAW Response: (%s) %s", res.statusCode, res.statusMessage);
});

// Listen for the `open` event on `proxy`.
// This event is emitted once the proxy websocket was created and piped into the target websocket.
proxy.on("open", function(proxySocket) {
    console.log("WebSocket Open Event");

    // listen for messages coming FROM the target here
    proxySocket.on("data", function(data) {
        logger.debug("Socket data: %s", JSON.stringify(data));
    });
});

// Listen for the `close` event on `proxy`.
// This event is emitted once the proxy websocket was closed.
proxy.on("close", function(res, socket, head) {
    console.log("WebSocket close event");
});

// proxyReq: This event is emitted before the data is sent. It gives you a chance to alter the proxyReq request object.
// Applies to "web" connections
proxy.on("proxyReq", function(res, socket, head) {
    console.log("ProxyReq event");
});

// proxyReqWs: This event is emitted before the data is sent. It gives you a chance to alter the proxyReq request object.
// Applies to "websocket" connections
proxy.on("proxyReqWs", function(res, socket, head) {
    console.log("ProxyReqWs event");
});

// proxyRes: This event is emitted if the request to the target got a response.
proxy.on("proxyRes", function(res, socket, head) {
    console.log("ProxyRes event");
});

//proxyServer.listen(port);

function wsOpen() {
    let path = "/websocket/open";
    let url = "http://127.0.0.1:" + config.upgraderPort + path;
    let body = {};
    body.url = config.appURL;
    body.queueing = false;
    sendHttpReq(url, "POST", body);
}

function sendHttpReq(url, method, body) {
    logger.debug("Sending %s request to %s", method, url);
    let opts = {};
    opts.method = method;
    if (method === "POST") opts.headers = {"Content-Type": "application/json"};
    if (typeof frontProxyAgent !== "undefined") opts.agent = frontProxyAgent;

    let req = http.request(url, opts, function(res) {
        res.setEncoding("utf8");
        res.on("data", function(body) {
            logger.debug("Response body: " + body);
        });
    });

    req.on("error", function(e) {
        logger.error("problem with request: %s", e.message);
    });

    // write data to request body
    if (typeof body !== "undefined") req.write(JSON.stringify(body));
    req.end();
}
