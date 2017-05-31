'use strict';
var 
    util = require('yyl-util'),
    wServer = require('./w-server'),
    wProxy = require('./w-proxy'),
    vars = require('./w-vars'),
    path = require('path'),
    fs = require('fs');

var 
    wOptimize = function(){
        var 
            iArgv = util.makeArray(arguments),
            iEnv = util.envPrase(iArgv);

        new util.Promise(function(next){

            util.msg.info('build server config start');
            wServer.buildConfig(iEnv.name, function(err, config){ // 创建 server 端 config
                if(err){
                    return util.msg.error('build server config error:', err);
                }

                util.msg.success('build server config done');
                next(config);

            });

        }).then(function(config, next){ // 检测 localserver.root 是否存在
            util.msg.info('check localserver.root exist:', config.localserver.root);

            if(!config.localserver.root){
                return util.msg.error('config.localserver.root is null! please check');
            } else {
                if(!fs.existsSync(config.localserver.root)){
                    util.mkdirSync(config.localserver.root);
                    util.msg.create(config.localserver.root);
                }

                next(config);
            }

        }).then(function(config, next){ // server init
            util.msg.info('server init start');
            wServer.init(config.workflow, function(err){
                if(err){
                    return util.msg.error('server init error', err);
                }

                util.msg.success('server init done');
                next(config);

            });
        }).then(function(config, next){ // 代理服务初始化
            if(iEnv.proxy && config.proxy){
                var iProxyConfig = util.extend(true, config.proxy);
                if(config.commit.hostname){
                    if(!iProxyConfig.localRemote){
                        iProxyConfig.localRemote = {};
                    }
                    var key = config.commit.hostname.replace(/[\\/]$/, '');
                    var val = util.joinFormat('http://127.0.0.1:' + config.localserver.port);
                    iProxyConfig.localRemote[key] = val;
                }
                wProxy.init(iProxyConfig, function(err){
                    if(err){
                        util.msg.warn('proxy init error', err);
                    }
                    next(config);
                });

            } else {
                util.msg.info('no proxy, next');
                next(config);
            }

        }).then(function(config){ // 运行命令
            util.msg.info('run cmd start');

            var workFlowPath = path.join(vars.SERVER_WORKFLOW_PATH, config.workflow);
            var cmd = 'gulp ' + iArgv.join(' ');
            var handle;

            if(/watch/.test(iArgv[0])){
                wServer.start(config.localserver.root, config.localserver.port, true);
            }


            util.msg.info('run cmd:', cmd);
            if(util.vars.IS_WINDOWS){
                handle = util.runCMD;
            } else {
                handle = util.runSpawn;
            }

            handle(cmd, function(err){
                if(err){
                    return util.msg.error(iArgv[0], 'task run error', err);
                }
                util.msg.success('run cmd done');

            }, workFlowPath);
        }).start();

    };


module.exports = wOptimize;

