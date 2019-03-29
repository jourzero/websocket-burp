FROM node:11
#FROM node:11.6-alpine

# Create app directory
WORKDIR /app


RUN apt-get update
RUN apt-get -y install vim netcat lsof

# Copy local source to /app
COPY . .

# Get node modules
RUN npm install --production

EXPOSE 4242
CMD PORT=4242 npm start
#CMD NODE_TLS_REJECT_UNAUTHORIZED=0 DEBUG="express:*,http:*,webapi-proxy:*,https-proxy-agent:*,ws:*" PORT=4242 npm start
