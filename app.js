var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var redis = require('redis');
var db_blpop = redis.createClient(),
    db_rpush = redis.createClient(),
    db_sadd = redis.createClient(),
    db_rnd = redis.createClient(),
    db_sub = redis.createClient(),
    db_pub = redis.createClient();i
var requestify = require('requestify');

db_sub.on("error", function (err) {
        console.log("redis Error " + err);
});

var bodyParser = require('body-parser');
var uuid = require('node-uuid');
var i = 0,j=0;
const SET_CLIENT_LIST="SET_CLIENT_LIST";

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
app.use(bodyParser.json());

db_sadd.on('ready',function(){
    console.log(' reset client list@  TIME:' + Date.now());
    db_sadd.smembers(SET_CLIENT_LIST,function(err,data){
        console.log(' get last list::' ,data);

        for (item in data){ 
           console.log(' remove client::' ,data[item]);
           db_sadd.srem(SET_CLIENT_LIST,data[item]);
        }
    });
});

app.get('/', function (req, res) {
    console.log(' get / AT TIME:' + Date.now());
});

app.post('/proxy', function (req, res) {
    //for test
    //res.json({"error": "no client error . timeout"});
    //res.end();
    //return;

    j=0;
    console.log(++i,'-',++j, ' .post to /proxy AT TIME:' + Date.now(), 'srvtype:',req.query.srvtype);
    var jsonrequest = {
        "request": req.body,
        "from": req.url,
        "to": req.query.to,
        "uuid": uuid.v4()};

    if (req.query.srvtype==undefined){
        requestify.post(jsonrequest.to,  jsonrequest.request)
             .then(function (response) {
                         response.getBody();
                          var dataobj = {};
                        dataobj.result = JSON.parse(response.body);
                         res.json(JSON.stringify(dataobj));
            });
         
    }else{

    jsonrequest.request.quuid = jsonrequest.uuid; //for test trace the result 
    console.log(i,'-',++j,' wait for blpop: ', JSON.stringify(jsonrequest.uuid));
    //get client
    db_rnd.srandmember(SET_CLIENT_LIST, function (err, data) {
        console.log(i,'-',++j, "get client :",  data);
        if (data == null) {
            res.json({"error": "no client error . timeout"});
        } else {
            db_pub.publish(JSON.parse(data).id, JSON.stringify(jsonrequest));
        }
   });
  //tset
   //db_rnd.rpush(JSON.stringify(jsonrequest.uuid),'{"result":{}}');

    db_blpop.blpop(JSON.stringify(jsonrequest.uuid), 4, function (err, data) {
        console.log(i,'-',++j, "get blpop", jsonrequest.uuid, data);
        if (data == null) {
            res.json({"error": "timeout"});
        } else {
            res.json(JSON.parse(data[1]).result);
        }
    });
    //test
    //db_rnd.rpush(JSON.stringify(jsonrequest.uuid),'{"result":{}}');
    //
    //io.emit('jsonrequest', JSON.stringify(jsonrequest));
   }
});

server.listen(9001, function () {
    console.log("Express server listening on port " + 9001);
});

//socket.io
io.on('connection', function (socket) {
    var clientid = socket.id;
    socket.emit('getid', clientid);
    console.log(clientid + " conected to server @ " + Date.now());
    //console.log((socket));
    var clientobj = '{"id":"'+clientid+'"}';
    db_sadd.sadd(SET_CLIENT_LIST,clientobj);

    socket.on('result', function (data) {
        console.log(i,'-',++j, 'get result:', JSON.stringify(data));
        var dataObj = JSON.parse(data);
        //db_pub.publish(dataObj.uuid,data);
        db_rpush.rpush(JSON.stringify(dataObj.uuid), data, function (err, obj) {
            console.log(i,'-',++j, ' rpush ok: ', dataObj.uuid);
        });
        //console.log(i,'rpush: ', dataObj.uuid);
    });

    socket.on('disconnect', function () {
        io.sockets.emit( 'user ', clientid , ' disconnected');
        console.log(clientid + " disconected  @ " + Date.now());
        db_sadd.srem(SET_CLIENT_LIST,clientobj);//remove client
    });
    
   var db_sub1 = redis.createClient();
    db_sub1.subscribe(clientid);
    db_sub1.on('message',function(channel,message){
        //if (channel==clientid){
           //test
          // db_rpush.rpush(JSON.stringify(message.uuid), message, function (err, obj) {});
          //test end
           
           console.log(i,'-',++j,clientid + " receiver message & socket.emit to client :  " ,message);
            socket.emit('jsonrequest', message);
      //}
    });

});

