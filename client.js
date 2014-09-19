var socket = require('socket.io-client')('http://192.168.1.15:9001/');
var app = require('express')();
var server = require('http').Server(app);
var requestify = require('requestify');

var i = 0;

socket.name = "client" + Date.now();

socket.on('connect', function () {
    console.log(socket.name + ' connected to server');
    //socket.on('event', function(data){});
    //socket.on('disconnect', function(){});
});


socket.on('jsonrequest', function (data) {
    console.log(++i, '. request data: ', JSON.stringify(JSON.parse(data).request));
    var dataobj = JSON.parse(data);

    requestify.post(dataobj.to, dataobj.request)
        .then(function (response) {
            // Get the response body
            response.getBody();

            dataobj.result = JSON.parse(response.body);
            socket.emit('result', JSON.stringify(dataobj));
            console.log(' result data: ', JSON.stringify(dataobj.result));

        });

});

//for test
app.post('/', function (req, res) {
    console.log('post to / AT TIME:' + Date.now());
    res.json({"testdata": "test", "time": Date.now()});
});

server.listen(9002, function () {
    console.log("Express server test client listening on port " + 9002);
});

