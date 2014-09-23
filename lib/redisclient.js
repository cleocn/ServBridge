var redis = require('redis');
var log = require('log4node');

exports.getRedis = function (config ) {

    var redisclient = redis.createClient(config.REDIS_PORT || 6379,config.REDIS_HOST || "127.0.0.1");

    redisclient.on('ready', function () {
        console.log('[redisclient.js] reset redis client list@  TIME:' + Date.now());
        redisclient.smembers(config.REDIS_KEY_SET_SRVTYPE || "REDIS_KEY_SET_SRVTYPE", function (err, srvtypedata) {
            console.log('[redisclient.js] get last redis srv list :' , srvtypedata);
            srvtypedata.forEach(function(srv_string) {
                redisclient.smembers(srv_string, function (err, client_arr) {
                    console.log('[redisclient.js] get last redis client list of ::' +srv_string, client_arr);
                    client_arr.forEach(function(client_str){
                        console.log('[redisclient.js] remove client::',srv_string, client_str);
                        //因为服务器重启，移除之前的client
                        redisclient.srem( srv_string,client_str);
                    });
                });
            } );
        });
    });

    redisclient.on("error", function (err) {
        console.log("redis Error " + err);
    });

    return redis;
};
