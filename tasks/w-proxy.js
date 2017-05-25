'use strict';
var
    util = require('yyl-util'),
    http = require('http'),
    net = require('net'),
    fs = require('fs'),
    url = require('url');


var
    wProxy = {
        init: function(op, done){
            var 
                iPort = op.port || 8887;

            var 
                server = http.createServer(function(req, res){

                    var 
                        reqUrl = req.url,
                        iAddrs = Object.keys(op.localRemote);

                    // 本地代理
                    var 
                        remoteUrl = reqUrl.replace(/\?.*$/, '').replace(/\#.*$/, ''),
                        localData,
                        httpRemoteUrl;

                    iAddrs.forEach(function(addr){
                        var localAddr = op.localRemote[addr];

                        if(!localAddr){
                            return true;
                        }

                        

                        if(addr === remoteUrl.substr(0, addr.length)){
                            var subAddr = util.joinFormat(localAddr, remoteUrl.substr(addr.length));

                            if(/^http(s)?:/.test(localAddr)){
                                httpRemoteUrl = subAddr;
                                return false;
                            }

                            if(fs.existsSync(subAddr)){
                                localData = fs.readFileSync(subAddr);
                                return false;
                            }
                        }

                    });

                    if(localData){ // 存在本地文件

                        util.msg.success('proxy local:', req.url);
                        res.write(localData);
                        res.end();

                    } else { // 透传 or 转发
                        var 
                            iUrl = httpRemoteUrl || req.url,
                            iBuffer = new Buffer(''),
                            linkit = function(iUrl, iBuffer){
                                var vOpts = url.parse(iUrl);
                                vOpts.headers = req.headers;

                                var vRequest = http.request(vOpts, function(vRes){
                                    if(vRes.statusCode == 404 && httpRemoteUrl == iUrl){
                                        vRes.on('end', function(){
                                            linkit(req.url, iBuffer);
                                        });

                                        return vRequest.abort();
                                    }

                                    vRes.on('data', function(chunk){
                                        res.write(chunk, 'binary');
                                    });

                                    vRes.on('end', function(){
                                        res.end();
                                    });

                                    res.writeHead(vRes.statusCode, vRes.headers);
                                });

                                vRequest.write(iBuffer, 'binary');
                                vRequest.end();

                            };

                        req.on('data', function(chunk){
                            iBuffer.write(chunk.toString());
                        });

                        req.on('end', function(){
                            linkit(iUrl, iBuffer);
                        });
                    }

                });

            util.msg.success('proxy server start');
            util.msg.success('proxy config localRemote:', JSON.stringify(op.localRemote, null, 4));
            util.msg.success('proxy server port:', iPort);

            server.listen(iPort);

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

                conn.on('error', function() {
                    // util.msg.error("Server connection error: ", e);
                    socket.end();
                });

            });

            server.on('error', function(err){
                if(err.code == 'EADDRINUSE'){
                    util.msg.error('proxy server start fail:', iPort ,'is occupied, please check');

                } else {
                    util.msg.error('proxy server error', err);
                }
            });

            done();
        }
    };

module.exports = wProxy;
