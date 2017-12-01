'use strict';

var util = require('./w-util.js');
var fs = require('fs');

var md2JSON = function(iPath){
        if(!fs.existsSync(iPath)){
            return;
        }
        var r = [];
        var iCnt = fs.readFileSync(iPath).toString();

        var i = 10;
        var iCntArr = iCnt.split(/[\r\n\t]+/);

        console.log(iCntArr);

        // iCnt = iCnt.replace(/[\r\n\t]+\#\#\s+([^\#]+)/g, function(str, $1){
            
        //     if(i-- > 0){
        //         console.log($1);
        //         console.log('=============')

        //     }
            
        // });
        return r;

    };
var 
    wTest = function(){
        md2JSON(util.joinFormat(__dirname, '../history.md'));

        // var server = http.createServer();

        // server.on('request', function(req, res){

        // });

        // // ws 监听, 转发
        // server.on('connect', function(req, socket){
        //     var addr = req.url.split(':');
        //     //creating TCP connection to remote server
        //     var conn = net.connect(addr[1] || 443, addr[0], function() {
        //         // tell the client that the connection is established
        //         socket.write('HTTP/' + req.httpVersion + ' 200 OK\r\n\r\n', 'UTF-8', function() {
        //             // creating pipes in both ends
        //             conn.pipe(socket);
        //             socket.pipe(conn);
        //         });

                
        //     });

        //     socket.on('error', function(){
        //         socket.end();
        //         conn.end();
        //     });

        //     conn.on('error', function() {
        //         // util.msg.error("Server connection error: ", e);
        //         socket.end();
        //         conn.end();
        //     });

        // });

        // server.listen(8887);

    };

module.exports = wTest;
