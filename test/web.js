var app = require('express')();
var server = require('http').Server(app);
//var requestify = require('requestify');
//var bodyParser = require('body-parser');

//app.use(bodyParser.json());

app.post('/', function (req, res) {
    console.log('post to / AT TIME:' + Date.now());
    //console.log('get request.body : '+ JSON.stringify(req.body));
    
    res.json({"testdata": "test", "time": Date.now()});
    //res.json({"testdata": "test", "time": Date.now(),"uuid":req.body.uuid});
});

server.listen(9002, function () {
    console.log("Express server test client listening on port " + 9002);
});




