'use strict';
var util = require('./w-util.js');
var path = require('path');
var fs = require('fs');
var revHash = require('rev-hash');
var Concat = require('concat-with-sourcemaps');
var chalk = require('chalk');

    var 
        supercall = {
            
            
            // 执行 concat 操作
            concat: function(op){
                var config = util.getConfigSync(op);
                
                if(!config){
                    return util.msg.warn('concat run fail');
                }

                var 
                    relativeIt = function(iPath){
                        return util.joinFormat(path.relative(config.alias.dirname, iPath));
                    },
                    concatIt = function(dest, srcs){
                        if(op.concatType && path.extname(dest).replace(/^\./, '') != op.concatType){
                            return;
                        }
                        var concat = new Concat(false, dest, '\n');
                        srcs.forEach(function(item){
                            if(!fs.existsSync(item)){
                                util.msg.warn(relativeIt(item), 'is not exist', 'break');
                                return;
                            }
                            concat.add(null, '/* ' + path.basename(item) + ' */');
                            concat.add(item, fs.readFileSync(item));
                        });

                        util.mkdirSync(path.dirname(dest));
                        fs.writeFileSync(dest, concat.content);
                        util.msg.concat(
                            util.printIt(dest), 
                            '<=', 
                            srcs.map(function(p){ 
                                return util.printIt(p); 
                            })
                        );
                    };

                if(config.concat){
                    for(var dist in config.concat){
                        if(config.concat.hasOwnProperty(dist)){
                            concatIt(dist, config.concat[dist]);
                        }
                    }
                    util.msg.success('concat done');
                } else {
                    util.msg.success('concat done', 'config.concat is null');
                }

            },

            // 执行完 watch 后
            watchDone: function(op){
                if(op.ver == 'remote'){
                    return;
                }

                var config = util.getConfigSync(op);
                
                if(!config){
                    return util.msg.warn('watchDone run fail');
                }


                var htmls = util.readFilesSync(config.alias.destRoot, /\.html$/),
                    addr,
                    addrDebug,
                    localServerAddr = 'http://' + util.vars.LOCAL_SERVER + ':' + config.localserver.port,
                    localServerAddr2 = 'http://127.0.0.1:' + config.localserver.port,
                    iHost = config.commit.hostname.replace(/\/$/, '');

                htmls.sort(function(a, b){
                    var aName = path.basename(a);
                    var bName = path.basename(b);
                    var reg = /^index|default$/;
                    var aReg = reg.exec(aName);
                    var bReg = reg.exec(bName);

                    if(aReg && !bReg){
                        return -1;

                    } else if(!aReg && bReg){
                        return 1;

                    } else {
                        return a.localeCompare(b);
                    }
                });

                if(op.proxy) {
                    var iAddr = '';
                    if(config.proxy && config.proxy.localRemote){
                        for(var key in config.proxy.localRemote){
                            iAddr = config.proxy.localRemote[key].replace(/\/$/, '');
                            if((iAddr === localServerAddr || iAddr === localServerAddr2) && key.replace(/\/$/, '') !== iHost){
                                addr = key;
                                break;
                            }
                        }
                    }

                    if(!addr){
                        addr = config.commit.hostname;
                    }

                } else {
                    addr = localServerAddr;
                }
                

                if(!op.silent){
                    if(htmls.length){
                        addr = util.joinFormat(addr, path.relative(config.alias.destRoot, htmls[0]));
                        addrDebug = util.joinFormat(localServerAddr2, path.relative(config.alias.destRoot, htmls[0]));
                    }

                    util.msg.info('open addr:');
                    util.msg.info(addr);
                    util.openBrowser(addr);
                    
                    if(op.debug){
                        util.msg.info('open debug addr:');
                        util.msg.info(addrDebug);
                        util.openBrowser(addrDebug);
                    }


                } else {
                    util.msg.success('watch-done finished');
                }

            },
            // rev-manifest 生成
            rev: {
                fn: {
                    mark: {
                        source: {
                            create: [],
                            update: [],
                            other: []
                        },
                        add: function(type, iPath){
                            var self = this;
                            self.source[type in self.source? type: 'other'].push(iPath);
                        },
                        reset: function(){
                            var self = this;
                            Object.keys(self.source).forEach(function(key){
                                self.source[key] = [];
                            });

                        },
                        print: function(){
                            var source = this.source;
                            util.msg.rev([
                                chalk.green('create: ') + source.create.length,
                                chalk.cyan('update: ') + source.update.length,
                                chalk.gray('other: ') + source.other.length
                            ].join(', '));
                        },
                    },

                    // 路径纠正
                    resolveUrl: function(cnt, extname){
                        var 
                            iExt = extname.replace(/^\./g, ''),
                            r = '',
                            htmlReplace = function(iCnt){
                                var pathReg = /(url\s*\(['"]?)([^'"]*?)(['"]?\s*\))/ig;
                                var pathReg2 = /(src\s*=\s*['"])([^'" ]*?)(['"])/ig;
                                var pathReg3 = /(href\s*=\s*['"])([^'" ]*?)(['"])/ig;
                                var filterHandle = function(str, $1, $2, $3){
                                    var iPath = $2;

                                    if(iPath.match(/^(about:|data:)/)){
                                        return str;
                                    } else {
                                        return $1 + util.path.join($2) + $3;
                                    }

                                };


                                return iCnt.replace(pathReg, filterHandle).replace(pathReg2, filterHandle).replace(pathReg3, filterHandle);

                            },
                            cssReplace = function(iCnt){
                                var pathReg = /(url\s*\(['"]?)([^'"]*?)(['"]?\s*\))/ig;
                                var pathReg2 = /(src\s*=\s*['"])([^'" ]*?)(['"])/ig;

                                var filterHandle = function(str, $1, $2, $3){
                                    var iPath = $2;

                                    if(iPath.match(/^(about:|data:)/)){
                                        return str;
                                    } else {
                                        return $1 + util.joinFormat($2) + $3;
                                    }

                                };

                                return iCnt.replace(pathReg, filterHandle).replace(pathReg2, filterHandle);

                            };
                        switch(iExt){
                            case 'html':
                                r = htmlReplace(cnt);
                                break;

                            case 'css':
                                r = cssReplace(cnt);
                                break;

                            default:
                                r = cnt;
                                break;
                        }

                        return r;

                    },

                    // hash map 生成
                    buildHashMap: function(iPath, revMap){
                        var config = util.getConfigCacheSync();
                        var 
                            revSrc = util.joinFormat(path.relative(config.alias.revRoot, iPath)),
                            hash = '-' + revHash(fs.readFileSync(iPath)),
                            revDest = revSrc.replace(/(\.[^\.]+$)/g, hash + '$1');

                        revMap[revSrc] = revDest;
                    },
                    // 文件 hash 替换
                    fileHashPathUpdate: function(iPath, revMap){
                        var iCnt = fs.readFileSync(iPath).toString();
                        var rCnt = iCnt;
                        var selfFn = this;

                        rCnt = selfFn.resolveUrl(rCnt, path.extname(iPath));

                        Object.keys(revMap).forEach(function(key){
                            rCnt = rCnt.split(key).join(revMap[key]);
                        });

                        if(iCnt != rCnt){
                            selfFn.mark.add('update', iPath);
                            fs.writeFileSync(iPath, rCnt);
                        }

                    },
                    buildRevMapDestFiles: function(revMap){
                        var config = util.getConfigCacheSync();
                        var selfFn = this;
                        if(!config){
                            return;
                        }
                        Object.keys(revMap).forEach(function(iPath){
                            var revSrc = util.joinFormat(config.alias.revRoot, iPath);
                            var revDest = util.joinFormat(config.alias.revRoot, revMap[iPath]);

                            if(!fs.existsSync(revSrc)){
                                return;
                            }

                            selfFn.mark.add(fs.existsSync(revDest)? 'update': 'create', revDest);
                            fs.writeFileSync(revDest, fs.readFileSync(revSrc));

                        });

                    }
                },
                // 文件名称
                filename: 'rev-manifest.json',
                // rev-build 入口
                build: function(op){
                    var config = util.getConfigSync(op);
                    var self = this;
                    var selfFn = self.fn;
                    if(!config){
                        return util.msg.warn('rev-build run fail', 'config not exist');
                    }

                    if(!config.commit.revAddr){
                        util.msg.warn('config.commit.revAddr not set, rev task not run');
                        return;
                    }

                    // 如果是 remote 直接执行 rev-update
                    if(op.ver){
                        util.msg.info('ver is not blank, run rev-update');
                        return supercall.rev.update(op);
                    }

                    


                    // 清除 dest 目录下所有带 hash 文件
                    supercall.rev.clean(op);

                    var 
                        htmlFiles = [],
                        jsFiles = [],
                        cssFiles = [],
                        resourceFiles = [];

                    util.readFilesSync( config.alias.root, function(iPath){
                        var r;
                        var iExt = path.extname(iPath);
                        if(/\.(html|json)/.test(iExt)){
                            r = false;
                        } else {
                            r = true;
                        }

                        switch(iExt){
                            case '.css':
                                cssFiles.push(iPath);
                                break;

                            case '.js':
                                jsFiles.push(iPath);
                                break;

                            case '.html':
                                htmlFiles.push(iPath);
                                break;

                            default:
                                if(r){
                                    resourceFiles.push(iPath);
                                }
                                break;

                        }

                        return r;
                    });

                    // 生成 hash 列表
                    var revMap = {};
                    
                    // 重置 mark
                    selfFn.mark.reset();

                    // 生成 资源 hash 表
                    resourceFiles.forEach(function(iPath){
                        selfFn.buildHashMap(iPath, revMap);
                    });

                    // 生成 js hash 表
                    jsFiles.forEach(function(iPath){
                        selfFn.buildHashMap(iPath, revMap);
                    });

                    // css 文件内路径替换 并且生成 hash 表
                    cssFiles.forEach(function(iPath){
                        // hash路径替换
                        selfFn.fileHashPathUpdate(iPath, revMap);
                        // 生成hash 表
                        selfFn.buildHashMap(iPath, revMap);
                    });

                    // html 路径替换
                    htmlFiles.forEach(function(iPath){
                        selfFn.fileHashPathUpdate(iPath, revMap);
                    });

                    // 根据hash 表生成对应的文件
                    selfFn.buildRevMapDestFiles(revMap);
                    

                    // 版本生成
                    revMap.version = util.makeCssJsDate();

                    // rev-manifest.json 生成
                    util.mkdirSync(config.alias.revDest);
                    var 
                        revPath = util.joinFormat(config.alias.revDest, supercall.rev.filename),
                        revVerPath = util.joinFormat(
                            config.alias.revDest, 
                            supercall.rev.filename.replace(/(\.\w+$)/g, '-' + revMap.version + '$1')
                        );

                    fs.writeFileSync(revPath, JSON.stringify(revMap, null, 4));
                    selfFn.mark.add('create', revPath);

                    // rev-manifest-{cssjsdate}.json 生成
                    fs.writeFileSync(revVerPath, JSON.stringify(revMap, null, 4));
                    selfFn.mark.add('create', revVerPath);

                    selfFn.mark.print();
                    util.msg.success('rev-build finished');
                },
                
                // rev-update 入口
                update: function(op){
                    var self = this;
                    var selfFn = self.fn;
                    var config = util.getConfigSync(op);
                    if(!config){
                        return util.msg.warn('rev-update run fail', 'config not exist');
                    }
                    if(!config.commit.revAddr){
                        util.msg.warn('config.commit.revAddr not set, rev task not run');
                        return;
                    }

                    // 重置 mark
                    selfFn.mark.reset();

                    new util.Promise(function(next){ // 获取 rev-manifest
                        if(op.ver == 'remote'){ // 远程获取 rev-manifest
                            if(config.commit.revAddr){
                                util.msg.info('get remote rev start:', config.commit.revAddr);
                                var requestUrl = config.commit.revAddr; 
                                requestUrl += (~config.commit.revAddr.indexOf('?')? '&': '?') + '_=' + (+new Date());
                                util.get(requestUrl, function(content){
                                    var iCnt;
                                    try {
                                        iCnt = JSON.parse(content.toString());
                                        util.msg.success('get remote finished');
                                    } catch(er){
                                        util.msg.warn('get remote rev fail', er);
                                    }

                                    next(iCnt);
                                });

                            } else {
                                util.msg.warn('get remote rev fail', 'config.commit.revAddr is null');
                                next(null);
                            }

                        } else { 
                            next(null);
                        }

                    }).then(function(revMap, next){ // 获取本地 rev-manifest
                        if(revMap){
                            return next(revMap);
                        }
                        
                        var localRevPath = util.joinFormat(config.alias.revDest, supercall.rev.filename);

                        if(fs.existsSync(localRevPath)){
                            try {
                                revMap = JSON.parse(fs.readFileSync(localRevPath).toString());

                            } catch(er){
                                return util.msg.warn('local rev file parse fail', er);
                            }

                            next(revMap);

                        } else {
                            return util.msg.warn('local rev file not exist', localRevPath);
                        }

                    }).then(function(revMap, next){ // hash 表内html, css 文件 hash 替换
                        // html 替换
                        var htmlFiles = util.readFilesSync(config.alias.root, /\.html$/);

                        htmlFiles.forEach(function(iPath){
                            selfFn.fileHashPathUpdate(iPath, revMap);
                        });

                        // css 替换
                        Object.keys(revMap).forEach(function(iPath){
                            var filePath = util.joinFormat(config.alias.revRoot, iPath);

                            if(fs.existsSync(filePath)){
                                switch(path.extname(filePath)){
                                    case '.css':
                                        self.fn.fileHashPathUpdate(filePath, revMap);
                                        break;

                                    default:
                                        break;
                                }
                            }
                        });

                        next(revMap);

                    }).then(function(revMap, next){ // hash对应文件生成
                        selfFn.buildRevMapDestFiles(revMap);
                        next(revMap);

                    }).then(function(revMap){ // 本地 rev-manifest 更新
                        var localRevPath = util.joinFormat(config.alias.revDest, supercall.rev.filename);
                        var localRevData;
                        var revContent = JSON.stringify(revMap, null, 4);

                        if(fs.existsSync(localRevPath)){
                            localRevData = fs.readFileSync(localRevPath).toString();

                            if(localRevData != revContent){
                                fs.writeFileSync(localRevPath, revContent);
                                selfFn.mark.add('update', localRevPath);
                            }


                        } else {
                            util.mkdirSync(config.alias.revDest);
                            fs.writeFileSync(localRevPath, revContent);
                            selfFn.mark.add('create', localRevPath);
                        }

                        selfFn.mark.print();
                        util.msg.success('rev-update finished');
                        

                    }).start();

                    

                    

                },
                // rev-clean 入口
                clean: function(op){
                    var config = util.getConfigSync(op);
                    if(!config){
                        return util.msg.warn('rev-clean run fail', 'config not exist');
                    }

                    

                    var files = util.readFilesSync(config.alias.root);
                    files.forEach(function(iPath){
                        if(
                            /-[a-zA-Z0-9]{10}\.?\w*\.\w+$/.test(iPath) && 
                            fs.existsSync(iPath.replace(/-[a-zA-Z0-9]{10}(\.?\w*\.\w+$)/, '$1'))
                        ){
                            try{
                                util.msg.del('delete file fail', util.printIt(iPath));
                                fs.unlinkSync(iPath);
                            } catch(er){
                                util.msg.warn('delete file fail', util.printIt(iPath));
                            }
                        }
                    });

                    util.msg.success('rev-clean finished');

                }

            },
            // 清除 dest 目录文件
            cleanDest: function(op){
                var config = util.getConfigSync(op);

                util.removeFiles(config.alias.destRoot, function(){
                    util.msg.success('clear-dest finished');
                });

            },
            // resource 文件 配置（自定义 复制 src 某文件到 dest 下面）
            resource: function(op){
                var config = util.getConfigSync(op);

            util.copyFiles(config.resource);
        },

        livereload: function(){
            util.livereload();
        },

        // yyl 脚本调用入口
        run: function(){
            var
                iArgv = util.makeArray(arguments),
                ctx = iArgv[1],
                op = util.envParse(iArgv.slice(1));

            switch(ctx){
                case 'watch-done':
                case 'watchDone':
                    supercall.watchDone(op);
                    break;

                case 'concat':
                    supercall.concat(op);
                    break;

                case 'concat-css':
                    supercall.concat(util.extend(op, { concatType: 'css' }));
                    break;

                case 'concat-js':
                    supercall.concat(util.extend(op, { concatType: 'js' }));
                    break;

                case 'rev-build':
                    supercall.rev.build(op);
                    break;
                case 'rev-update':
                    supercall.rev.update(op);
                    break;

                case 'clean-dest':
                    supercall.cleanDest(op);
                    break;

                case 'rev-clean':
                    supercall.rev.clean(op);
                    break;

                case 'resource':
                    supercall.resource(op);
                    break;

                case 'livereload':
                    supercall.livereload(op);
                    break;

                default:
                    break;
            }

        }

    };

module.exports = supercall;
