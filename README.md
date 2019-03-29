# WebAPI Proxy

Proxy that profiles a RESTful web API front-end to a Websocket web service.

## Running with Docker

``` bash
$ ./docker-all.sh 


-- Running docker-stop.sh
-proxy


-- Running docker-build.sh
Sending build context to Docker daemon  6.491MB
Step 1/8 : FROM node:11
 ---> 2698faaff1ee
Step 2/8 : WORKDIR /app
 ---> Using cache
 ---> ee794ed94a54
Step 3/8 : RUN apt-get update
 ---> Using cache
 ---> 6c3df2478d39
Step 4/8 : RUN apt-get -y install vim netcat lsof
 ---> Using cache
 ---> b75ddde06f25
Step 5/8 : COPY . .
 ---> b01200b35d2f
Step 6/8 : RUN npm install --production
 ---> Running in 7527937db6e1
npm notice created a lockfile as package-lock.json. You should commit this file.
added 105 packages from 111 contributors and audited 205 packages in 4.334s
found 0 vulnerabilities

Removing intermediate container 7527937db6e1
 ---> d201a7404d59
Step 7/8 : EXPOSE 4242
 ---> Running in ea8643a371fb
Removing intermediate container ea8643a371fb
 ---> 819841cd13b8
Step 8/8 : CMD PORT=4242 npm start
 ---> Running in 113d9dd77ae3
Removing intermediate container 113d9dd77ae3
 ---> ed6ca8b91b36
Successfully built ed6ca8b91b36
Successfully tagged -proxy:latest


-- Running docker-run-detached.sh
fdd6c9cf30a6c5ab5ac4d70704c138efcb43b17c42bb054bf4ea8a4d7baf3ccb


-- Running docker-logs.sh

> -proxy@0.0.0 start /app
> node ./bin/www
```
