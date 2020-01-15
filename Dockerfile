FROM node:11
#FROM node:11.6-alpine

RUN apt-get update
RUN apt-get -y install vim netcat lsof

# Set user
USER node

# Create app directory
WORKDIR /app

# Copy local source to /app
#COPY . .

# Get node modules
#RUN npm install

EXPOSE 8082 8083 8084
ENV NODE_TLS_REJECT_UNAUTHORIZED=0
ENV PORT=8082 
ENV PORT2=8084 
#CMD [ "/bin/bash" ]
#CMD NODE_TLS_REJECT_UNAUTHORIZED=0 DEBUG="express:*,http:*,webapi-proxy:*,https-proxy-agent:*,ws:*" PORT=8082 npm start
CMD [ "/bin/bash" ]
#CMD NODE_TLS_REJECT_UNAUTHORIZED=0 PORT=8082 npm start
