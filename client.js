var socket = require('socket.io-client')('http://192.168.1.15:9001/');
var requestify = require('requestify');

var i = 0;


socket.on('connect', function () {
   // console.log(socket);
    console.log(  'connected to server @ '+ Date.now());
    //socket.on('event', function(data){});
    //socket.on('disconnect', function(){});
});


socket.on('disconnect', function(){
    console.log(  'disconnected from  server @ '+ Date.now());
    
});

socket.on('getid',function(data){
    console.log('haha , my id is : ',data);   
});


socket.on('jsonrequest', function (data) {
    console.log(++i, '.get  request data: ', JSON.stringify(JSON.parse(data).request));

    var dataobj = JSON.parse(data);
    dataobj.request.ruuid = dataobj.uuid;
    console.log(i, '. post  data to service : ', JSON.stringify( dataobj.request));

    requestify.post(dataobj.to,  dataobj.request)
        .then(function (response) {
            // Get the response body
            response.getBody();

            dataobj.result = JSON.parse(response.body);
            socket.emit('result', JSON.stringify(dataobj));
            console.log(' result data: ', JSON.stringify(dataobj.result));

        });

});
