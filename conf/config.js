module.exports = function(){

  var cfg = {};
    cfg.root = ".";
    cfg.port = 9001     ;

    cfg.REDIS_PORT = 6379;
    cfg.REDIS_HOST = "127.0.0.1";

    
    cfg.SOCKETSERVER  = "http://192.168.1.15:9001";
	cfg.CLIENT_SRVTYPE = "DEFAULT",

    cfg.REDIS_KEY_SET_CLIENT_LIST = "REDIS_CLIENT_LIST";
    cfg.REDIS_KEY_SET_SRVTYPE = "REDIS_KEY_SET_SRVTYPE";

    cfg.SOCKET_EMIT_HELLO = "SOCKET_EMIT_HELLO";
    cfg.SOCKET_EMIT_REQUEST = "SOCKET_EMIT_REQUEST";
    cfg.SOCKET_EMIT_RESULT = "SOCKET_EMIT_RESULT";

  return cfg;

};
