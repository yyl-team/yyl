'use strict';
var
    util = require('yyl-util'),
    http = require('http'),
    net = require('net'),
    fs = require('fs'),
    url = require('url');


var
    wProxy = {
        init: function(op, done, showlog){
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

                        util.msg.info('proxy local', req.url);
                        res.write(localData);
                        res.end();

                    } else { // 透传 or 转发
                        if(showlog){
                            util.msg.info('proxy remote =>', req.url);
                        }
                        var 
                            iUrl = httpRemoteUrl || req.url,
                            body = [],
                            linkit = function(iUrl, iBuffer){
                                var vOpts = url.parse(iUrl);
                                vOpts.method = req.method;
                                vOpts.headers = req.headers;
                                vOpts.body = body;


                                var vRequest = http.request(vOpts, function(vRes){
                                    if(/^404|405$/.test(vRes.statusCode) && httpRemoteUrl == iUrl){

                                        vRes.on('end', function(){
                                            if(showlog){
                                                util.msg.info('proxy local server not found, to remote:', iUrl);
                                            }
                                            linkit(req.url, iBuffer);
                                        });

                                        return vRequest.abort();
                                    }

                                    vRes.on('data', function(chunk){
                                        res.write(chunk, 'binary');
                                    });

                                    vRes.on('end', function(){
                                        if(showlog){
                                            util.msg.info('proxy end <=', vRes.statusCode, iUrl);
                                        }
                                        res.end();
                                    });
                                    vRes.on('error', function(){
                                        res.end();
                                    });

                                    var iHeader = util.extend(true, {}, vRes.headers);


                                    res.writeHead(vRes.statusCode, iHeader);

                                    
                                });

                                vRequest.write(body);
                                vRequest.end();

                            };

                        req.on('data', function(chunk){
                            body.push(chunk);
                        });


                        req.on('end', function(){
                            body = Buffer.concat(body).toString();
                            linkit(iUrl, body);
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

                    socket.on('error', function(){
                        socket.end();
                        conn.end();
                    });
                });

                conn.on('error', function() {
                    // util.msg.error("Server connection error: ", e);
                    socket.end();
                    conn.end();
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
