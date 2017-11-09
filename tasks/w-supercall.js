'use strict';
var util = require('./w-util.js');
var vars = require('./w-vars');
var path = require('path');
var fs = require('fs');
var Concat = require('concat-with-sourcemaps');

var 
    supercall = {
        getConfigSync: function(op){
            var 
                userConfigPath = vars.USER_CONFIG_FILE,
                userConfig,
                iConfig;
            if(!fs.existsSync(userConfigPath)){
                return false;
            }
            try{
                userConfig = require(userConfigPath);
            } catch(er){
                util.msg.warn('supercall getConfig fail', 'require('+ userConfigPath +') parse fail');
                return false;
            }

            if(op.name){
                userConfig = userConfig[op.name];
                if(!userConfig){
                    util.msg.warn('supercall getConfig fail', 'userConfig['+ op.name +'] is null');
                    return false;
                }
            }

            if(!userConfig.workflow){
                util.msg.warn('supercall getConfig fail', 'config.workflow is not exists', serverConfigPath);
                return false;
            }

            var serverConfigPath = path.join(vars.SERVER_WORKFLOW_PATH, userConfig.workflow, 'config.js');

            if(!fs.existsSync(serverConfigPath)){
                util.msg.warn('supercall getConfig fail', 'serverConfigPath is not exists:', serverConfigPath);
                return false;
            }

            iConfig = require(serverConfigPath);

            if(op.name){
                if(iConfig[op.name]){
                    return util.initConfig(iConfig[op.name]);
                } else {
                    util.msg.warn('supercall getConfig fail', 'config['+ op.name +'] is no content');
                    return false;
                }
            } else {
                return util.initConfig(iConfig);
            }

        },
        // 执行 concat 操作
        concat: function(op){
            var config = supercall.getConfigSync(op);
            
            if(!config){
                return util.msg.warn('concat run fail');
            }

            var 
                relativeIt = function(iPath){
                    return util.joinFormat(path.relative(config.alias.dirname, iPath));
                },
                concatIt = function(dest, srcs){
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
                    util.msg.info(
                        'concat file:', 
                        relativeIt(dest), 
                        '<=', 
                        srcs.map(function(p){ 
                            return relativeIt(p); 
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

            var config = supercall.getConfigSync(op);
            
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


            }

        },
        // yyl 脚本调用入口
        run: function(){
            var
                iArgv = util.makeArray(arguments),
                ctx = iArgv[1],
                op = util.envParse(iArgv.slice(1));

            switch(ctx){
                case 'watchDone':
                    supercall.watchDone(op);
                    break;

                case 'concat':
                    supercall.concat(op);
                    break;

                default:
                    break;
            }

        }

    };

module.exports = supercall;
