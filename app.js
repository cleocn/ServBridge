var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var redis = require('redis');
var db_blpop = redis.createClient();
var db_rpush = redis.createClient();

var bodyParser = require('body-parser');
var uuid = require('node-uuid');
var i = 0;

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
app.use(bodyParser.json());

app.get('/', function (req, res) {
    console.log(' get / AT TIME:' + Date.now());
});

app.post('/proxy', function (req, res) {
    console.log(++i, ' .post to /proxy AT TIME:' + Date.now());
    var jsonrequest = {
        "request": req.body,
        "from": req.url,
        "to": req.query.to,
        "uuid": uuid.v4()};
    console.log('wait for blpop: ', JSON.stringify(jsonrequest.uuid));
    db_blpop.blpop(JSON.stringify(jsonrequest.uuid), 4, function (err, data) {
        console.log(i, "get blpop", jsonrequest.uuid, data);
        if (data == null) {
            res.json({"error": "timeout"});
        } else {
            res.json(JSON.parse(data[1]).result);
        }
    });
    //
    io.emit('jsonrequest', JSON.stringify(jsonrequest));

});

server.listen(9001, function () {
    console.log("Express server listening on port " + 9001);
});

//socket.io
io.on('connection', function (socket) {
    console.log(socket.name + " conected to server @ " + Date.now());

    socket.on('result', function (data) {
        console.log(i, 'get result:', JSON.stringify(data));
        var dataObj = JSON.parse(data);
        //db_pub.publish(dataObj.uuid,data);
        db_rpush.rpush(JSON.stringify(dataObj.uuid), data, function (err, obj) {
            console.log(i, 'rpush ok: ', dataObj.uuid);
        });
        //console.log(i,'rpush: ', dataObj.uuid);
    });

    socket.on('disconnect', function () {
        io.sockets.emit('user disconnected');
    });

});

