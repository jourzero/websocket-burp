#!/bin/bash
HOST_SHARE="/private/var/tmp/logs"
CTR_SHARE="/app/logs"
mkdir $HOST_SHARE 2>/dev/null
chmod 777 $HOST_SHARE
/usr/local/bin/docker run -p 4242:4242 -d --rm --name webapi-proxy --mount "type=bind,source=${HOST_SHARE},target=${CTR_SHARE}" webapi-proxy 2>&1
