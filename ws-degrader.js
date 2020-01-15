const http = require("http"),
    httpProxy = require("http-proxy"),
    config = require("./config.js"),
    logger = require("./lib/appLogger.js");

// Get port from environment and store in Express.
const port = config.degraderPort;

// Setup our server to proxy standard HTTP requests
let proxy = new httpProxy.createProxyServer({ target: config.appURL });
let proxyServer = http.createServer(function(req, res) {
    proxy.web(req, res);
});

// Listen to the `upgrade` event
proxyServer.on("upgrade", function(req, socket, head) {
    logger.debug("Upgrade requested");

    // proxy the WebSocket requests as well.
    proxy.ws(req, socket, head);
});
proxyServer.on("listening", onListening);

proxy.on("proxyReq", function(proxyReq, req, res, options) {
    proxyReq.setHeader("X-Special-Proxy-Header", "foobar");
    //logger.debug("RAW Request to proxy: %s", proxyReq.headers);
    logger.debug("RAW Request : %s", JSON.stringify(req.headers));
});

//
// Listen for the `proxyRes` event on `proxy`.
//
proxy.on("proxyRes", function(proxyRes, req, res) {
    logger.debug("RAW Response from the target", proxyRes.headers);
});

proxyServer.listen(port);

function onListening() {
    console.debug("WebSocket Degrader Proxy Server listening on " + port);
}
