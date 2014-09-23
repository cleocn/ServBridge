var redis = require('redis');
var log = require('log4node');

exports.getApp = function ( config ) {
    var app = require('express')();

    var db_blpop = redis.createClient(config.REDIS_PORT || 6379,config.REDIS_HOST || "127.0.0.1"),
        db_rnd =redis.createClient(config.REDIS_PORT || 6379,config.REDIS_HOST || "127.0.0.1"),
        db_pub = redis.createClient(config.REDIS_PORT || 6379,config.REDIS_HOST || "127.0.0.1");
    var requestify = require('requestify');

    var bodyParser = require('body-parser');
    var uuid = require('node-uuid');
    var i = 0,j=0;

// parse application/x-www-form-urlencoded
    app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
    app.use(bodyParser.json());

    app.get('/', function (req, res) {
        console.log('[proxy.js] test get / @ TIME:' + Date.now());
        res.end('[proxy.js]  ok.');
    });

    app.post('/proxy/:srvtype?', function (req, res) {
        //for test
        //res.json({"error": "no client error . timeout"});
        //res.end();
        //return;

        j=0;
        console.log(++i,  ' [proxy.js] post to /proxy AT TIME:' + Date.now(), 'query:',req.query,'srvtype:',req.params.srvtype);
        var jsonrequest = {
            "request": req.body,
            "from": req.url,
            "to": req.query.to,

            "uuid": uuid.v4()};

        if (req.params.srvtype==undefined){
            requestify.post(jsonrequest.to,  jsonrequest.request)
                .then(function (response) {
                    response.getBody();
                    var dataobj = {};
                    dataobj.result = JSON.parse(response.body);
                    res.json(JSON.stringify(dataobj));
                });

        }else{

            jsonrequest.request.quuid = jsonrequest.uuid; //for test trace the result
            console.log(i, '[proxy.js] wait for blpop: ', JSON.stringify(jsonrequest.uuid));
            //从redis的client list 中随机获取 client
            db_rnd.srandmember((config.REDIS_KEY_SET_CLIENT_LIST||"REDIS_CLIENT_LIST") + req.params.srvtype, function (err, data_clientid) {
                console.log(i,"[proxy.js] get client :",  data_clientid);
                if (data_clientid == null) { //没有发现client
                    res.end({"error": "[proxy.js] no client error . timeout"});
                } else {
                    db_pub.publish(data_clientid, JSON.stringify(jsonrequest),function(){
                		console.log(i, "[proxy.js] request publish to redis:",  data_clientid, JSON.stringify(jsonrequest));
						});
                }
            });
            //tset
            //db_rnd.rpush(JSON.stringify(jsonrequest.uuid),'{"result":{}}');

            db_blpop.blpop(JSON.stringify(jsonrequest.uuid), 4, function (err, data) {
                console.log(i, "[proxy.js] get blpop", jsonrequest.uuid, data);
                if (data == null) {
                    res.end({"error": "[proxy.js]  timeout"});
                } else {
                    res.end(JSON.stringify(JSON.parse(data[1]).result));
                    console.log(i, "[proxy.js] ok");
                }
            });
            //test
            //db_rnd.rpush(JSON.stringify(jsonrequest.uuid),'{"result":{}}');
            //
            //io.emit('jsonrequest', JSON.stringify(jsonrequest));
        }
    });

    return app;
};

