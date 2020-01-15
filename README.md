# README for WS-PROXY

The ws-proxy.js app starts-up a front-end websocket degrader (ws-degrader.js) so that we can downgrade websocket traffic to HTTP and then later reupgrade it by using a REST API(in ws-upgrader.js). The upgrade app is based on ExpressJS and includes a test web app at /tester.html.

The whole reason to downgrade to HTTP is to be able to insert an HTTP fuzzer
like Burp or OWASP ZAP in the loop for fuzzing purposes.

Lastly, a sample websocket app (ws-sample-app) is included to test the whole chain.

## Running with Docker

Run this app using these commands:

```bash
$ docker build -t ws-proxy .
<OUTPUT SUPPRESSED>

$ docker run -it --rm -p 127.0.0.1:8082-8084:8082-8084 --mount type=bind,source="$PWD",target=/app --name ws-proxy ws-proxy

node@b86942635e74:/app$ whoami
node
node@b86942635e74:/app$ npm start

> ws-proxy@0.0.0 start /app
> nodemon --ignore logs/ ws-proxy.js

[nodemon] 2.0.2
[nodemon] to restart at any time, enter `rs`
[nodemon] watching dir(s): *.*
[nodemon] watching extensions: js,mjs,json
[nodemon] starting `node ws-proxy.js`
info: App ws-proxy is starting...
info: Starting sample WebSocket app at http://127.0.0.1:8084
WebSocket Degrader Proxy Server listening on 8082
debug: WebSocket Upgrader App/API Server is listening on port 8083
info: NOTE: Try the tester app at http://127.0.0.1:8083/tester.html
```
