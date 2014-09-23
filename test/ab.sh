#!/bin/bash

#本地服务代理
curl -l -H "Content-type: application/json" -X POST -d '{"pwd":"test"}' http://192.168.1.15:9001/proxy?to=http://localhost:9002/

#长连接隧道代理
curl -l -H "Content-type: application/json" -X POST -d '{"pwd":"test"}' http://192.168.1.15:9001/proxy/DEFAULT?to=http://localhost:9002/

#本地服务代理
ab -n10000 -c200 -T "application/json" -p ./test/post.json  http://192.168.1.5:9001/proxy?to=http://localhost:9002/

#长连接隧道代理
ab -n5000 -c200 -T "application/json" -p ./test/post.json  http://192.168.1.5:9001/proxy/DEFAULT?to=http://localhost:9002/