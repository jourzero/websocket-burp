#!/bin/bash
. ./.env
set -x
docker-build.sh \
  --build-arg HTTP_PROXY_URL=$BURP \
  --build-arg TARGET_APP_URL=$TARGET

