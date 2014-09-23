ServBridge
=============
采用 NodeJS、Redis、socket.io技术，构造一个高性能的服务调用桥,也可以说是服务代理或者类似http隧道。


主要可以用来解决两个问题：<br/>
* json跨域调用问题<br/>
*  将网络调用访问，变成双向消息交换。<br/>

修改日志
-----------

v0.3 支持多个分组client
v0.2 支持多个client
v0.1 单个client


场景
-----------
![](https://raw.githubusercontent.com/cleocn/ServBridge/master/doc/deploy.png)


主要原理
------------
A原本是想访问D，服务A所在A区无法直接访问服务D所在区域的服务。

通过在C区建立一个长连接到B，B接受来自A的访问请求，通过长连接迅速传递给C，同时通过redis的BLPOP阻塞自己，等待数据。
C立刻调用D访问到A真正需要的数据。通过长连接传递给B，写入redis。B从blpop阻塞中恢复。将数据返回给A。
 

A=> B <= | <= C =>D

![](https://raw.githubusercontent.com/cleocn/ServBridge/master/doc/%E8%AE%BE%E8%AE%A1.png)


 

使用方式
-----------
A:本来想调用D服务：http://localhost:9002/
则采用这个地址代替： http://192.168.1.15:9001/proxy?to=http://localhost:9002/

B:启动服务http://192.168.1.15:9001/proxy
[root@local ~]# node app.js

C：启动客户端,自动和B建立连接
[root@local ~]# node client.js

D：在client.js中模拟了测试服务地址 http://localhost:9002/

测试方式：
------------
 curl -l -H "Content-type: application/json" -X POST -d '{"phone":"13521389587","password":"test"}' http://192.168.1.15:9001/proxy?to=http://localhost:9002/



AB测试结果
------------
<pre>
# ab -n1000 -c50 -T "application/json" -p ./test/post.js  http://192.168.1.15:9001/proxy/DEFAULT?to=http://localhost:9002/
This is ApacheBench, Version 2.3 <$Revision: 1430300 $>
Copyright 1996 Adam Twiss, Zeus Technology Ltd, http://www.zeustech.net/
Licensed to The Apache Software Foundation, http://www.apache.org/

Benchmarking 192.168.1.15 (be patient)
Completed 100 requests
Completed 200 requests
Completed 300 requests
Completed 400 requests
Completed 500 requests
Completed 600 requests
Completed 700 requests
Completed 800 requests
Completed 900 requests
Completed 1000 requests
Finished 1000 requests


Server Software:
Server Hostname:        192.168.1.15
Server Port:            9001

Document Path:          /proxy?to=http://localhost:9002/
Document Length:        40 bytes

Concurrency Level:      50
Time taken for tests:   6.333 seconds
Complete requests:      1000
Failed requests:        0
Write errors:           0
Total transferred:      205000 bytes
Total body sent:        198000
HTML transferred:       40000 bytes
Requests per second:    157.90 [#/sec] (mean)
Time per request:       316.665 [ms] (mean)
Time per request:       6.333 [ms] (mean, across all concurrent requests)
Transfer rate:          31.61 [Kbytes/sec] received
                        30.53 kb/s sent
                        62.14 kb/s total

Connection Times (ms)
              min  mean[+/-sd] median   max
Connect:        0    1   2.2      1      12
Processing:   160  312 105.8    304     793
Waiting:      160  311 105.9    303     792
Total:        161  313 105.9    305     794

Percentage of the requests served within a certain time (ms)
  50%    305
  66%    325
  75%    333
  80%    336
  90%    345
  95%    629
  98%    726
  99%    784
 100%    794 (longest request)

</pre>

Useful links:
-------------
* http://redis.io/
* http://nodejs.org/
* http://expressjs.com/
* http://socket.io/

contact
-------------
cleocn@gmail.com