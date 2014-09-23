var log = require('log4node');
var config = require( process.argv[2]|| "./conf/config")();
var socketserver = process.argv[3] ||  config.SOCKETSERVER || 'http://192.168.1.15:9001/';
console.log('connceting to : '+socketserver+ ' ...');
var socketclient = require('socket.io-client')(socketserver);
var requestify = require('requestify');


var i = 0;

socketclient.on('connect', function () {
   // log.info(socket);
    log.info(  'connected to server @ '+ Date.now());
    //socket.on('event', function(data){});
    //socket.on('disconnect', function(){});
	
	var initobj = {};
	initobj.srvtype = process.argv[4] ||  config.CLIENT_SRVTYPE || 'DEFAULT';
    log.info('emited',config.SOCKET_EMIT_INIT || "SOCKET_EMIT_INIT", initobj);
	socketclient.emit(config.SOCKET_EMIT_INIT || "SOCKET_EMIT_INIT", JSON.stringify(initobj),function(){
        log.info('emited', initobj);
		});
});

socketclient.on('connect_error', function (err) {
    log.error(err);
});

socketclient.on('disconnect', function(){
    log.info(  'disconnected from  server @ '+ Date.now());
});

socketclient.on(config.SOCKET_EMIT_HELLO || "SOCKET_EMIT_HELLO",function(data){
    log.info('haha , my id is : ',data);
});


socketclient.on(config.SOCKET_EMIT_REQUEST || "SOCKET_EMIT_REQUEST", function (data) {
    log.info(++i, '.get  request data: ', JSON.stringify(JSON.parse(data)));

    var dataobj = JSON.parse(data);
    dataobj.request.ruuid = dataobj.uuid;
    log.info(i, '. post  data to service : ' + dataobj.to, JSON.stringify( dataobj.request));

    requestify.post(dataobj.to,  dataobj.request)
        .then(function (response) {
            // Get the response body
            response.getBody();

            dataobj.result = JSON.parse(response.body);
            socketclient.emit(config.SOCKET_EMIT_RESULT||"SOCKET_EMIT_RESULT", JSON.stringify(dataobj));
            log.debug(' result data: ', JSON.stringify(dataobj.result));

        });

});
