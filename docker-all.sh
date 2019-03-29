#!/bin/bash

echo -e "\n\n-- Running docker-stop.sh"
./docker-stop.sh;

echo -e "\n\n-- Running docker-build.sh"
./docker-build.sh ;

answer=y
#read -p "Run Detached? [y]: " answer
if [ "$answer" != "n" ];then

  echo -e "\n\n-- Running docker-run-detached.sh"
  ./docker-run-detached.sh 

  echo -e "\n\n-- Running docker-logs.sh"
  ./docker-logs.sh 
else

  echo -e "\n\n-- Running docker-run.sh"
  ./docker-run.sh 
fi
