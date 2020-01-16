#========================================================================================
# Dockerfile for ws-proxy
#
# ** Example Use **
# docker build -t ws-proxy .
# docker run -it --rm -p 127.0.0.1:8082:8084 --mount type=bind,source=$PWD,target=/app \
#            --name ws-proxy ws-proxy
#========================================================================================
FROM node:13
#FROM node:11

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
EXPOSE 8082 8083 8084
ENV PORT=8082 
ENV PORT2=8084 
#ENV HTTP_PROXY_FRONT=http://192.168.9.125:8081
ENV HTTP_PROXY_BACK=http://192.168.9.125:8081
#ENV NODE_TLS_REJECT_UNAUTHORIZED=0

#CMD DEBUG="express:*,http:*,ws-proxy:*,https-proxy-agent:*,ws:*" PORT=8082 npm start
#CMD [ "/bin/bash" ]
CMD [ "sh", "-c", "env; npm install; npm start" ]
