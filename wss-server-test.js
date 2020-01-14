const fs = require("fs");
//const https = require("https");
const https = require("http");
const WebSocket = require("ws");

//let options = {cert: fs.readFileSync("certs/cert.pem"), key: fs.readFileSync("certs/key.pem")};
let options = {};

const server = https.createServer(options, (req, res) => {
    console.debug("Received a request");
    res.writeHead(200);
    res.end("WebSocket Test App\n");
});

const wss = new WebSocket.Server({server});
wss.on("connection", function connection(ws) {
    ws.on("message", function incoming(message) {
        console.log("Received: %s", message);
        console.log("Echoing: %s", message.toUpperCase());
        ws.send(message.toUpperCase());
    });
});

console.info("Test app listening on port 8084...");
server.listen(8084);
