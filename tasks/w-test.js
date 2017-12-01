'use strict';

var util = require('./w-util.js');
var net = require('net');
var http = require('http');

var 
    wTest = function(){
        var server = http.createServer();

        server.on('request', function(req, res){

        });

        // ws 监听, 转发
        server.on('connect', function(req, socket){
            var addr = req.url.split(':');
            //creating TCP connection to remote server
            var conn = net.connect(addr[1] || 443, addr[0], function() {
                // tell the client that the connection is established
                socket.write('HTTP/' + req.httpVersion + ' 200 OK\r\n\r\n', 'UTF-8', function() {
                    // creating pipes in both ends
                    conn.pipe(socket);
                    socket.pipe(conn);
                });

                
            });

            socket.on('error', function(){
                socket.end();
                conn.end();
            });

            conn.on('error', function() {
                // util.msg.error("Server connection error: ", e);
                socket.end();
                conn.end();
            });

        });

        server.listen(8887);

    };

module.exports = wTest;
