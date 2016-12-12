'use strict';
var 
    util = require('../lib/yyl-util'),
    wServer = require('./w-server'),
    vars = util.vars,
    path = require('path');

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

        }).then(function(config, next){ // server init
            util.msg.info('server init start');
            
            wServer.init(config.workflow, function(err){
                if(err){
                    return util.msg.error('server init error', err);
                }

                util.msg.success('server init done');
                next(config);

            }, true);

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

