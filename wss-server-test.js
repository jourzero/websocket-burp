const fs = require("fs");
const https = require("https");
const WebSocket = require("ws");

const server = https.createServer({
    cert: fs.readFileSync("cert.pem"),
    key: fs.readFileSync("key.pem")
});
const wss = new WebSocket.Server({server});

wss.on("connection", function connection(ws) {
    ws.on("message", function incoming(message) {
        console.log("received: %s", message);
    });

    ws.send("something");
});

console.info("Listening on port 3000...");
server.listen(3000);
