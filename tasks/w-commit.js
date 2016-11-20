'use strict';
var 
    util = require('../lib/yyl-util'),
    vars = util.vars,
    wServer = require('./w-server.js'),
    path = require('path'),
    fs = require('fs');


var 
    events = {
        help: function(){
            util.help({
                usage: 'yyl commit --name <name> --sub <branch> ',
                commands: {
                    '<name>': 'project name if it have',
                    '<branch>': 'dev|commit|trunk'
                },
                options: {
                    '--name': 'project name if it have',
                    '--sub': 'branch name',
                    '-h, --help': 'print usage information'
                }
            });

        },

        run: function(){
            var 
                iEnv = util.envPrase(arguments);

            new util.Promise(function(next){ // env check
                if(!iEnv.sub){
                    return events.help();
                }
                next();

            }).then(function(next){ // parse config to server
                wServer.buildConfig(function(err, config){ // 创建 server 端 config
                    if(err){
                        return util.msg.error('yyl commit task error:', err);
                    }

                    util.msg.info('build server config success');
                    next(config);

                });
            }).then(function(config, next){ // check config
                var iConfig;
                if(iEnv.name){
                    iConfig = config[iEnv.name];

                } else {
                    iConfig = config;
                }


                if(!iConfig || !iConfig.alias){
                    util.msg.error('yyl commit task error', '--name is not right or config.js format error');
                    return;

                } else if(!iConfig.workflow) {
                    util.msg.error('yyl commit task error', 'config.js no workflow setting');
                } else {

                    var workFlowPath = path.join(vars.SERVER_WORKFLOW_PATH, config.workflow);
                    if(!fs.existsSync(workFlowPath)){
                        return util.msg.error('yyl commit task error', 'config.js workflow setting is not right');
                    }

                    var cmd = 'gulp all ' + util.envStringify(iEnv);

                    cmd += ' --isCommit 1';

                    util.runCMD([
                        'cd ' + workFlowPath,
                        cmd,
                        'cd ' + vars.PROJECT_PATH
                    ], function(err){
                        if(err){
                            return util.msg.error('yyl commit task run error', err);
                        }
                        next(iConfig);

                    }, workFlowPath);

                }

            }).then(function(config){ // run optimize
                console.log('optimize done!');


            }).start();

        }

    };


module.exports = events;
