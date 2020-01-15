const fs = require("fs");
//const https = require("https");
const https = require("http");
const WebSocket = require("ws");
const config = require("./config.js");
const logger = require("./lib/appLogger.js");
const port = config.sampleAppPort;

//let options = {cert: fs.readFileSync("certs/cert.pem"), key: fs.readFileSync("certs/key.pem")};
let options = {};

const server = https.createServer(options, (req, res) => {
    console.debug("Received a request");
    //res.writeHead(200);
    //res.end("WebSocket Test App\n");
    fs.readFile(__dirname + "/public/" + req.url, function(err, data) {
        if (err) {
            res.writeHead(404);
            res.end(JSON.stringify(err));
            return;
        }
        res.writeHead(200);
        res.end(data);
    });
});

const wss = new WebSocket.Server({ server });
wss.on("connection", function connection(ws) {
    ws.on("message", function incoming(message) {
        console.log("Received: %s", message);
        console.log("Echoing: %s", message.toUpperCase());
        ws.send(message.toUpperCase());
    });
});

logger.info(
    "Starting sample WebSocket app at http://127.0.0.1:%s/wstester.html",
    port
);
server.listen(port);
