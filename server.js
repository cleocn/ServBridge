var log = require('log4node');

function main( ) {
    var config = require( process.argv[2] || "./conf/config")(),
        root = config.root || '.',
        port = config.port || 9001;

    var redis = require('./lib/redisclient').getRedis(config);
    var app = require('./lib/proxy').getApp(config);
    var server = require('http').Server(app);
    var socket= require('./lib/socketioserver.js').initServer(server,config);

    server.listen(port, function () {
        log.info("proxy server listening on port " + port);
    });

    process.on('SIGTERM', function () {
        server.close(function () {
            process.exit(0);
        });
    });
}

main();
