var socket = require('socket.io');
var redis = require('redis');
var log = require('log4node');
var i = 0;

function bindEvent(io, config) {
    var db_rpush = redis.createClient(config.REDIS_PORT || 6379, config.REDIS_HOST || "127.0.0.1");
    db_sadd = redis.createClient(config.REDIS_PORT || 6379, config.REDIS_HOST || "127.0.0.1");

    //on connected
    io.on('connection', function (socket) {
        var clientid = 'CLIENTID:'+socket.id;
        //var clientid_redis = 'CLIENTID:' + clientid + '';

        //初始化时候，接收client传递过来的srvtype
        socket.on(config.SOCKET_EMIT_INIT || "SOCKET_EMIT_INIT", function (initdata) {
            console.log('[socketioserver.js] SOCKET_EMIT_INIT client initdata:', initdata);
            var initdataobj = JSON.parse(initdata);

            //断开链接时候
            socket.on('disconnect', function () {
                io.sockets.emit('user ', clientid, ' disconnected');
                console.log("[socketioserver.js] client "+clientid + " disconected  @ " + Date.now());

                //从redis中移除client
                db_sadd.srem((config.REDIS_KEY_SET_CLIENT_LIST || "REDIS_KEY_SET_CLIENT_LIST") + initdataobj.srvtype, clientid);//remove client
            });

            db_sadd.sadd((config.REDIS_KEY_SET_SRVTYPE || "REDIS_KEY_SET_SRVTYPE") ,(config.REDIS_KEY_SET_CLIENT_LIST || "REDIS_KEY_SET_CLIENT_LIST") + initdataobj.srvtype);

            //添加到客户端添加到redis的客户端列表
            db_sadd.sadd((config.REDIS_KEY_SET_CLIENT_LIST || "REDIS_CLIENT_LIST") + initdataobj.srvtype, clientid,function(){
                log.info("[socketioserver.js] add client to redis :[srvtype:"+ (config.REDIS_KEY_SET_CLIENT_LIST || "REDIS_KEY_SET_CLIENT_LIST") + initdataobj.srvtype + "]"+clientid)

                //test list
                db_sadd.smembers((config.REDIS_KEY_SET_CLIENT_LIST || "REDIS_CLIENT_LIST")+ initdataobj.srvtype, function (err, srvtypedata) {
                    console.log('[socketioserver.js] test last redis client list now ::',(config.REDIS_KEY_SET_CLIENT_LIST || "REDIS_KEY_SET_CLIENT_LIST")+initdataobj.srvtype , srvtypedata);
                });    //test end
            });

            //接收到socket.io client返回的json结果
            socket.on(config.SOCKET_EMIT_RESULT || "SOCKET_EMIT_RESULT", function (data) {
                console.log(i, '[socketioserver.js] get result:', JSON.stringify(data));
                var dataObj = JSON.parse(data);
                //db_pub.publish(dataObj.uuid,data);  //测试

                //将请求放回的json push到redis
                db_rpush.rpush(JSON.stringify(dataObj.uuid), data, function (err, obj) {
                    console.log(i, '[socketioserver.js] rpush ok: ', dataObj.uuid);
                });
                //console.log(i,'rpush: ', dataObj.uuid);
            });

            //订阅redis消息，订阅channel为客户端ID ，这里是接收到外部请求，将服务器emit到socket client
            var db_sub = redis.createClient();
            db_sub.subscribe(clientid);
            console.log(i, '[socketioserver.js] clientid subscribe:', clientid);
            db_sub.on('message', function (channel, message) {
                //if (channel==clientid){
                //test
                // db_rpush.rpush(JSON.stringify(message.uuid), message, function (err, obj) {});
                //test end

                console.log(i,"[socketioserver.js] "+ clientid + " receiver message & socket.emit to client :  ", message);
                //发送 请求到 socket client
                socket.emit(config.SOCKET_EMIT_REQUEST || "SOCKET_EMIT_REQUEST", message);
                //}
            });
        });



        //发送ClientID给client
        socket.emit(config.SOCKET_EMIT_HELLO || "SOCKET_EMIT_HELLO", clientid ,function(){
            console.log("[socketioserver.js] emit SOCKET_EMIT_HELLO to client: "+ clientid + "  @ " + Date.now());
            //console.log((socket));
        });

    });
}

exports.initServer = function (server, config) {
    var io = socket(server);
    bindEvent(io, config);

    console.log('[socketioserver.js] socket io server is running...');
};
