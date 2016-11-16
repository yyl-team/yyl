'use strict';
var 
    util = require('../lib/yyl-util'),
    wServer = require('./w-server'),
    vars = util.vars,
    path = require('path');

var 
    wOptimize = function(){
        var 
            iArgv = util.makeArray(arguments);

        new util.Promise(function(next){
            util.msg.info('build server config start');
            wServer.buildConfig(function(err, config){ // 创建 server 端 config
                if(err){
                    return util.msg.error(iArgv, 'task error:', err);
                }

                util.msg.info('build server config success');
                next(config);

            });

        }).then(function(config){ // 运行命令
            var workFlowPath = path.join(vars.SERVER_WORKFLOW_PATH, config.workflow);
            util.runCMD([
                'cd ' + workFlowPath,
                'gulp ' + iArgv.join(' '),
                'cd ' + vars.PROJECT_PATH
            ], function(err){
                if(err){
                    util.msg.error(iArgv[0], 'task run error', err);
                }

            }, workFlowPath);
        }).start();

    };


module.exports = wOptimize;

