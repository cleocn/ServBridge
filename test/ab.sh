#!/bin/bash

curl -l -H "Content-type: application/json" -X POST -d '{"phone":"13521389587","password":"test"}' http://192.168.1.15:9001/proxy?to=http://localhost:9002/

ab -n10000 -c200 -T "application/json" -p post.json  http://192.168.1.15:9001/proxy?to=http://localhost:9002/
