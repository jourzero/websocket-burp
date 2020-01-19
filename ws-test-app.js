const fs = require("fs");
//const https = require("https");
const https = require("http");
const WebSocket = require("ws");
const config = require("./config.js");
const log = require("./lib/appLogger.js");

//let options = {cert: fs.readFileSync("certs/cert.pem"), key: fs.readFileSync("certs/key.pem")};
let options = {};

// Front HTTP/HTTPS proxy to connect to (burp)
const port = Number(process.env.WTA_PORT) || config.testAppPort;
if (typeof port === "undefined") {
    log.debug("WTA: Test app not enabled");
    return;
}

// Configure HTTP Server
const server = https.createServer(options, (req, res) => {
    log.debug("WTA: Test App received a request for %s", req.url);
    let path = req.url;
    if (path === "/") path = "/index.html";
    fs.readFile(__dirname + "/public/TestApp" + path, function(err, data) {
        if (err) {
            res.writeHead(404);
            res.end(JSON.stringify(err));
            return;
        }
        res.writeHead(200);
        res.end(data);
    });
});

// Add WebSocket Support
const wss = new WebSocket.Server({server});
wss.on("connection", function connection(ws) {
    // Echo back incoming messages after conversion to uppercase
    ws.on("message", function incoming(message) {
        log.debug("WTA: Test App Received: %s", message);
        log.debug("WTA: Test App Echo Msg: %s", message.toUpperCase());
        ws.send(message.toUpperCase());
    });
});

log.info("WTA: Starting Test App at http://127.0.0.1:%s/wstester.html", port);
server.listen(port);
