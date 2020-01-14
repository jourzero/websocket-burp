FROM node:11
#FROM node:11.6-alpine

# Create app directory
WORKDIR /app


RUN apt-get update
RUN apt-get -y install vim netcat lsof

# Copy local source to /app
#COPY . .

# Get node modules
#RUN npm install --production

# Get node modules
RUN npm install
RUN npm install -g nodemon

EXPOSE 8082 8083 8084
ENV NODE_TLS_REJECT_UNAUTHORIZED=0
ENV PORT=8082 
ENV PORT2=8083 
#CMD [ "/bin/bash" ]
#CMD NODE_TLS_REJECT_UNAUTHORIZED=0 DEBUG="express:*,http:*,webapi-proxy:*,https-proxy-agent:*,ws:*" PORT=8082 npm start
CMD [ "/bin/bash" ]
#CMD NODE_TLS_REJECT_UNAUTHORIZED=0 PORT=8082 npm start
