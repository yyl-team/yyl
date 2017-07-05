'use strict';
var
    path = require('path'),
    util = require('yyl-util'),
    http = require('http'),
    net = require('net'),
    fs = require('fs'),
    url = require('url');

var 
    MIME_TYPE_MAP = {
        'css': 'text/css',
        'js': 'text/javascript',
        'html': 'text/html',
        'xml': 'text/xml',
        'txt': 'text/plain',

        'json': 'application/json',
        'pdf': 'application/pdf',
        'swf': 'application/x-shockwave-flash',

        'woff': 'application/font-woff',
        'ttf': 'application/font-ttf',
        'eot': 'application/vnd.ms-fontobject',
        'otf': 'application/font-otf',

        'wav': 'audio/x-wav',
        'wmv': 'video/x-ms-wmv',
        'mp4': 'video/mp4',

        'gif': 'image/gif'
        ,
        'ico': 'image/x-icon',
        'jpeg': 'image/jpeg',
        'jpg': 'image/jpeg',
        'png': 'image/png',
        'svg': 'image/svg+xml',
        'tiff': 'image/tiff'

    },
    PROXY_INFO_HTML = [
        '<div id="YYL_PROXY_INFO" style="position: fixed; z-index: 10000; bottom: 10px; right: 10px; padding: 0.2em 0.5em; background: #000; background: rgba(0,0,0,.5); font-size: 1.5em; color: #fff;">yyl proxy</div>',
        '<script>setTimeout(function(){ var el = document.getElementById("YYL_PROXY_INFO"); try{el.parentNode.removeChild(el)}catch(er){} }, 10000)</script>'
    ].join('');

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

                        var iExt = path.extname(req.url).replace(/^\./, '');
                        if(MIME_TYPE_MAP[iExt]){
                            res.setHeader('Content-Type', MIME_TYPE_MAP[iExt]);
                        }

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

                                        if(/text\/html/.test(res.getHeader('content-type'))){
                                            res.write(PROXY_INFO_HTML);
                                        }
                                        res.end();
                                    });
                                    vRes.on('error', function(){
                                        res.end();
                                    });

                                    var iHeader = util.extend(true, {}, vRes.headers);

                                    // 设置 header
                                    var iType = vRes.headers['content-type'];
                                    if(iType){
                                        res.setHeader('Content-Type', iType);
                                    } else {
                                        var iExt = path.extname(req.url).replace(/^\./, '');

                                        if(MIME_TYPE_MAP[iExt]){
                                            res.setHeader('Content-Type', MIME_TYPE_MAP[iExt]);
                                        }
                                    }

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
        },
        // // 往 html文件 最下方添加 html
        // appendHTML: function(res, url){
        //     var html;
        //     if(!html){
        //         html = PROXY_INFO_HTML;
        //     }

        //     // console.log('append check', res.getHeader('content-type'), url)
        //     console.log(res.data);

        //     if(!/text\/html/.test(res.getHeader('content-type'))){
        //         if (res.data !== undefined && !res._header) {
        //             res.setHeader('content-length', Buffer.byteLength(res.data));
        //         }
        //         return;
        //     }
        //     console.log('write it', url, res.getHeader('content-type'));

            

        //     res.write(new Buffer(html), 'binary');

        //     if (res.data !== undefined && !res._header) {
        //         res.setHeader('content-length', Buffer.byteLength(res.data));
        //     }

        // }
    };

module.exports = wProxy;
