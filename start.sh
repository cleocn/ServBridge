LOGFILE_SRV=$(dirname $0)/logs/sb-server.log
LOGFILE_CLI=$(dirname $0)/logs/sb-client.log
LOGFILE_TESTSRV=$(dirname $0)/logs/sb-testserver.log
#export ZK_HOST="localhost:2181"
nohup node $(dirname $0)/app.js 2>&1 >>$LOGFILE_SRV &
nohup node $(dirname $0)/client.js 2>&1 >>$LOGFILE_CLI &
nohup node $(dirname $0)/test/web.js 2>&1 >>$LOGFILE_TESTSRV &


