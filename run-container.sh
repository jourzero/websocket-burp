#!/bin/bash
. ./.env
set -x
docker-run.sh \
-e HTTP_PROXY_FRONT=$BURP \
-e HTTP_PROXY_BACK=$BURP \
-e NODE_TLS_REJECT_UNAUTHORIZED=0 \
-e TARGET_APP_URL=$TARGET
