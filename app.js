var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var redis = require('redis');
var db_blpop = redis.createClient(),
    db_rpush = redis.createClient(),
    db_sadd = redis.createClient(),
    db_rnd = redis.createClient(),
    db_sub = redis.createClient(),
    db_pub = redis.createClient();

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
    j=0;
    console.log(++i,'-',++j, ' .post to /proxy AT TIME:' + Date.now());
    var jsonrequest = {
        "request": req.body,
        "from": req.url,
        "to": req.query.to,
        "uuid": uuid.v4()};
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

    db_blpop.blpop(JSON.stringify(jsonrequest.uuid), 4, function (err, data) {
        console.log(i,'-',++j, "get blpop", jsonrequest.uuid, data);
        if (data == null) {
            res.json({"error": "timeout"});
        } else {
            res.json(JSON.parse(data[1]).result);
        }
    });
    //
    //io.emit('jsonrequest', JSON.stringify(jsonrequest));

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
    db_sadd.sadd(SET_CLIENT_LIST,'{"id":"'+clientid+'"}');

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
        db_sadd.srem(SET_CLIENT_LIST,clientid);//remove client
    });
    
    db_sub.subscribe(clientid);
    db_sub.on('message',function(channel,message){
        if (channel==clientid){
           console.log(i,'-',++j,clientid + " receiver message  @ " + Date.now());
       
            socket.emit('jsonrequest', message);
      }
    });

});

