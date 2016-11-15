'use strict';
var 
    util = require('../lib/yyl-util'),
    vars = util.vars,
    path = require('path'),
    fs = require('fs'),
    fn = {
        buildServerConfig: function(done){
            var
                configPath = path.join(vars.PROJECT_PATH, 'config.js'),
                mineConfigPath = path.join(vars.PROJECT_PATH, 'config.mine.js'),
                config,
                mineConfig;

            // 获取 config, config.mine 文件内容
            if(!fs.existsSync(configPath)){
                return done('config.js not found');
            }

            if(fs.existsSync(mineConfigPath)){
                try{
                    mineConfig = require(mineConfigPath);
                } catch(er){}

            }

            try{
                config = require(configPath);
            } catch(er){}

            if(!config){
                return done('nothing in config.js');
            }

            config = util.extend(true, config, mineConfig);

            var 
                iWorkFlows = fs.readdirSync(path.join(vars.BASE_PATH, 'init-files')),
                workFlowPath;

            if(!config.workflow || !~iWorkFlows.indexOf(config.workflow)){
                return done('config.workflow is not exist');
            }

            workFlowPath = path.join(vars.SERVER_WORKFLOW_PATH, config.workflow);

            var 
                pathTrans = function(iPath){
                    return util.joinFormat(
                        path.relative(
                            workFlowPath, 
                            path.join(vars.PROJECT_PATH, iPath)
                        )
                    );

                },
                relateHere = function(obj){
                    for(var key in obj){
                        switch(util.type(obj[key])){
                            case 'string':
                                obj[key] = pathTrans(obj[key]);
                                break;

                            default:
                                break;
                        }
                    }
                    return obj;
                };


            // 路径替换
            (function deep(obj){

                for( var key in obj ){
                    if(obj.hasOwnProperty(key)){
                        switch(util.type(obj[key])){
                            case 'object':
                                if(key == 'alias'){ // 替换 val
                                    obj[key] = relateHere(obj[key]);

                                } else {
                                    deep(obj[key]);
                                }
                                break;
                            case 'string':
                                break;

                            default:
                                break;
                        }
                    }

                }


            })(config);

            var fileStr = 'module.exports=' + JSON.stringify(config, null, 4);
            fs.writeFileSync(path.join(workFlowPath, 'config.js'), fileStr);
            done(null, config);
        }

    };

var 
    wOptimize = function(){
        var 
            iArgv = util.makeArray(arguments);

        new util.Promise(function(next){
            util.msg.info('build server config start');
            fn.buildServerConfig(function(err, config){ // 创建 server 端 config
                if(err){
                    return util.msg.error(iArgv, 'task error', err);
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
