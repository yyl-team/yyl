'use strict';
var util = require('yyl-util');
var vars = require('./w-vars');
var path = require('path');
var fs = require('fs');

var 
    supercall = {
        getConfigSync: function(){
            var 
                userConfigPath = vars.USER_CONFIG_FILE,
                userConfig;
            if(!fs.existsSync(userConfigPath)){
                return false;
            }
            try{
                userConfig = require(userConfigPath);
            } catch(er){
                return false;
            }

            if(!userConfig.workflow){
                return false;
            }

            var serverConfigPath = path.join(vars.SERVER_WORKFLOW_PATH, userConfig.workflow, 'config.js');

            if(!fs.existsSync(serverConfigPath)){
                return false;
            }

            return require(serverConfigPath);

        },
        // 执行完 watch 后
        watchDone: function(op){
            if(op.ver == 'remote'){
                return;
            }

            var config = supercall.getConfigSync();
            
            if(!config){
                return util.msg.warn('watchDone run fail', 'no config');
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

                default:
                    break;
            }

        }

    };

module.exports = supercall;
