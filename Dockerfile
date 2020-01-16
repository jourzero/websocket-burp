#========================================================================================
# Dockerfile for ws-proxy
# This is a websocket man-in-the-middle proxy that downgrades websocket connections to
# HTTP and then re-upgrades them to prevent breaking the. This downgrade is meant to
# to allow fuzzing by using tools such as Burp Suite or OWASP's Zed Attack Proxy. 
#
# Proxy chaining used: 
# Browser -> ws-degrader -> Burp(front) -> ws-upgrader -> Burp(back) -> Target App
#
# ** Example Use **
# docker build --build-arg HTTP_PROXY_URL=http://192.168.1.100:8081 \
#              --build-arg TARGET_APP_URL=http://127.0.0.1:8084 \
#              -t ws-proxy
# docker run -it --rm -p 127.0.0.1:8082-8084:8082-8084 \
#                --mount type=bind,source="$PWD",target=/app \
#                --name ws-proxy ws-proxy
#========================================================================================
FROM node:13

# Get some tools as root, as needed
RUN apt-get update
RUN apt-get -y install vim netcat lsof

# Set user 
USER node

# Create app directory
WORKDIR /app

# Not using the below. We mount the source directory instead (see Example Use above).
## Copy local source to /app
#COPY . .
## Get node modules
#RUN npm install

# Setup environment
# Port 8081 is default for Burp listening (on a non-loopback interface)
# Port 8082 is default for ws-degrader
# Port 8083 is default for ws-upgrader
# Port 8084 is used by ws-test-app
ARG HTTP_PROXY_URL
ARG TARGET_APP_URL
ENV HTTP_PROXY_FRONT=$HTTP_PROXY_URL
ENV HTTP_PROXY_BACK=$HTTP_PROXY_URL
ENV TARGET_APP_URL=$TARGET_APP_URL
ENV WSD_PORT=8082 
ENV WSU_PORT=8083 
ENV WTA_PORT=8084 
EXPOSE 8082 8083 8084
#ENV NODE_TLS_REJECT_UNAUTHORIZED=0

#CMD DEBUG="express:*,http:*,ws-proxy:*,https-proxy-agent:*,ws:*" PORT=8082 npm start
#CMD [ "/bin/bash" ]
CMD [ "sh", "-c", "env; npm install; npm start" ]