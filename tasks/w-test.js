'use strict';

var util = require('./w-util.js');
var fs = require('fs');

var 
    MD_REG = {
        TITLE_1: /^\#{1}\s+([^ ]+.*$)/,
        TITLE_2: /^\#{2}\s+([^ ]+.*$)/,
        TITLE_3: /^\#{3}\s+([^ ]+.*$)/,
        TITLE_4: /^\#{4}\s+([^ ]+.*$)/,
        TITLE_5: /^\#{5}\s+([^ ]+.*$)/,
        TITLE_6: /^\#{6}\s+([^ ]+.*$)/,
        LIST: /^\*\s+([^ ]+.*$)/,
        NUM_LIST: /^\d+\.\s+([^ ]+.*$)/
    };

var md2JSON = function(iPath){
        if(!fs.existsSync(iPath)){
            return;
        }
        var iCnt = fs.readFileSync(iPath).toString();
        var iCntArr = iCnt.split(/[\r\n]+/);

        var 
            treePoint = function(title, parent){
                this.title = title;
                this.contents = [];
                this.parents = [];
                this.children = [];
                this.deep = 0;
                if(parent){
                    if(parent.parents){
                        this.parents = parent.parents.concat(parent);
                    } else {
                        this.parents = [parent];
                    }

                    this.deep = this.parents.length;
                    
                    if(parent.children){
                        parent.children.push(this);
                    }

                }
            },
            r = new treePoint(),
            currentPoint = r;

        iCntArr.forEach(function(str){ // 逐行读取
            if(str.match(MD_REG.TITLE_1)){ // 1 级标题

            } else if(str.match(MD_REG.TITLE_2)){ // 2 级标题

            } else if(str.match(MD_REG.TITLE_3)){ // 3 级标题
            } else if(str.match(MD_REG.TITLE_4)){ // 4 级标题
            } else if(str.match(MD_REG.TITLE_5)){ // 5 级标题
            } else if(str.match(MD_REG.TITLE_6)){ // 6 级标题

            } else if(str.match(MD_REG.LIST)){ // 无序列表

            } else if(str.match(MD_REG.NUM_LIST)){ // 有序列表

            } else { // 一般内容

            }

        });

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
