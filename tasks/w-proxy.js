'use strict';
var
    util = require('yyl-util'),
    http = require('http'),
    path = require('path'),
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
                        localData;

                    iAddrs.forEach(function(addr){
                        var localAddr = op.localRemote[addr];

                        if(!localAddr){
                            return true;
                        }

                        if(addr === remoteUrl.substr(0, addr.length)){
                            var subAddr = path.join(localAddr, remoteUrl.substr(addr.length));

                            if(fs.existsSync(subAddr)){
                                localData = fs.readFileSync(subAddr);
                                return false;
                            }
                        }

                    });

                    if(localData){ // 存在本地文件
                        // res.writeHead(200, req.headers);
                        res.write(localData);
                        res.end();

                    } else { // 透传
                        var vOpts = url.parse(req.url);
                        vOpts.headers = req.headers;

                        var vRequest = http.request(vOpts, function(vRes){
                            vRes.on('data', function(chunk){
                                res.write(chunk, 'binary');
                            });

                            vRes.on('end', function(){
                                res.end();
                            });

                            res.writeHead(vRes.statusCode, vRes.headers);
                        });

                        req.on('data', function(chunk){
                            vRequest.write(chunk, 'binary');
                        });

                        req.on('end', function(){
                            vRequest.end();
                        });

                    }

                });

            util.msg.info('proxy server start');
            util.msg.info('proxy server port:', iPort);

            server.listen(iPort);

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
