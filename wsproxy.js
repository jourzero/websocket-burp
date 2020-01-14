const http = require("http"),
    httpProxy = require("http-proxy");

// Setup our server to proxy standard HTTP requests
let proxy = new httpProxy.createProxyServer({
    target: {
        host: "localhost",
        port: 3000
    }
});
let proxyServer = http.createServer(function(req, res) {
    proxy.web(req, res);
});

// Listen to the `upgrade` event and proxy the WebSocket requests as well.
proxyServer.on("upgrade", function(req, socket, head) {
    proxy.ws(req, socket, head);
});
proxyServer.on("listening", onListening);

proxyServer.listen(3001);

function onListening() {
    const addr = proxyServer.address();
    const bind =
        typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
    console.debug("HTTP proxy listening on " + bind);
}
