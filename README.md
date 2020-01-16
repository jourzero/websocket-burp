# README for WS-PROXY

The ws-proxy.js app starts-up a front-end websocket degrader (ws-degrader.js) so that we can downgrade websocket traffic to HTTP and then later reupgrade it by using a REST API (in ws-upgrader.js). The upgrade app is based on ExpressJS and includes a test web app at http://localhost/tester.html.

The whole reason to downgrade to HTTP is to be able to insert an HTTP fuzzer
like Burp or OWASP ZAP in the loop for fuzzing purposes.

Lastly, a test websocket app (ws-test-app) is included to test the whole chain.

## Proxy chaining used

This app implements this proxy chaining:

Browser --> ws-degrader --> Burp(front) --> ws-upgrader --> Burp(back) --> Target App

## Default Ports

The following ports are used (by default):

-   Port DOCKER_HOST:8081 for Burp listening (on the host, using a non-loopback interface)
-   Port 127.0.0.1:8082 for ws-degrader
-   Port 127.0.0.1:8083 for ws-upgrader
-   Port 127.0.0.1:8084 for ws-test-app

## Running with Docker

Run this app using these commands:

```bash
$ docker build --build-arg HTTP_PROXY_URL=http://192.168.1.100:8081 \
               --build-arg TARGET_APP_URL=http://127.0.0.1:8084 \
               -t ws-proxy
<OUTPUT SUPPRESSED>

$ docker run -it --rm -p 127.0.0.1:8082-8084:8082-8084 \
                 --mount type=bind,source="$PWD",target=/app \
                 --name ws-proxy ws-proxy
WSU_PORT=8083
NODE_VERSION=13.6.0
HOSTNAME=9ac984d2d53d
YARN_VERSION=1.21.1
HOME=/home/node
HTTP_PROXY_BACK=http://192.168.9.125:8081
HTTP_PROXY_FRONT=http://192.168.9.125:8081
TERM=xterm
WTA_PORT=8084
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
WSD_PORT=8082
PWD=/app
audited 375 packages in 3.056s

2 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities


> ws-proxy@0.0.0 start /app
> nodemon --ignore logs/ ws-proxy.js

[nodemon] 2.0.2
[nodemon] to restart at any time, enter `rs`
[nodemon] watching dir(s): *.*
[nodemon] watching extensions: js,mjs,json
[nodemon] starting `node ws-proxy.js`
info: WSP: App ws-proxy is starting...
info: WSD: Using front proxy server http://192.168.9.125:8081
debug: WSD: Created proxy server with options: {"target":"http://127.0.0.1:8084","agent":{"secureProxy":false,"proxy":{"protocol":"http:","slashes":true,"auth":null,"host":"192.168.9.125","port":8081,"hostname":"192.168.9.125","hash":null,"search":null,"query":null,"href":"http://192.168.9.125:8081/"}},"prependPath":true}
info: WSD: WebSocket Degrader Reverse Proxy Server at http://127.0.0.1:8082 fronting the target app at http://127.0.0.1:8084
info: WSU: Using back proxy server http://192.168.9.106:8081
info: WTA: Starting Test App at http://127.0.0.1:8084/wstester.html
info: WSP: WebSocket Upgrader API Server started. API Tester at http://127.0.0.1:8083/tester.html

(BROWSE TO http://127.0.0.1:8082/wstester.html)
debug: WTA: Test App received a request for /wstester.html
debug: WTA: Test App received a request for /css/style.css
debug: WTA: Test App received a request for /js/jquery.min.js

debug: WSD: HTTP upgrade event
debug: WSD: Emitting connection event
debug: WSD: WS connection event
info: WSD: Sending WS open request to ws-upgrader: {}
debug: WSD: Sending POST request to http://127.0.0.1:8083/websocket/open with body {"url":"http://127.0.0.1:8084"}
info: WSU: Websocket open for http://127.0.0.1:8084 with queueing=undefined
debug: WSD: Response data: {"op":"open"}

debug: WSD: WS message event (string): {"type":"event","message":"Just a test!","wsSendTime":"2020-01-16T21:32:19.333Z"}
info: WSD: Sending WS message to ws-upgrader: {"type":"event","message":"Just a test!","wsSendTime":"2020-01-16T21:32:19.333Z"}
debug: WSD: Sending POST request to http://127.0.0.1:8083/websocket/send with body {"type":"event","message":"Just a test!","wsSendTime":"2020-01-16T21:32:19.333Z"}
info: WSU: Cannot send to Websocket: Closed
debug: WSD: Response data: {"status":"Closed"}

debug: WSD: WS message event (string): {"type":"event","message":"Just a test!","wsSendTime":"2020-01-16T21:32:26.198Z"}
info: WSD: Sending WS message to ws-upgrader: {"type":"event","message":"Just a test!","wsSendTime":"2020-01-16T21:32:26.198Z"}
debug: WSD: Sending POST request to http://127.0.0.1:8083/websocket/send with body {"type":"event","message":"Just a test!","wsSendTime":"2020-01-16T21:32:26.198Z"}
info: WSU: Cannot send to Websocket: Closed
debug: WSD: Response data: {"status":"Closed"}

info: WSD: Sending WS close request to ws-upgrader: {}
debug: WSD: Sending POST request to http://127.0.0.1:8083/websocket/close with body {}
debug: WSD: WS close event
info: WSU: Cannot send to Websocket: Closed
debug: WSD: Response data: {"status":"Closed"}
```
