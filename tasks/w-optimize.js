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

            workFlowPath = path.join(vars.SERVER_PATH, config.workflow);

            var 
                pathTrans = function(iPath){
                    return util.joinFormat(
                        path.relative(
                            workFlowPath, 
                            path.join(vars.PROJECT_PATH, iPath)
                        )
                    );

                },
                objTrans = function(obj){
                    var r = {};
                    for(var key in obj){
                        if(obj.hasOwnProperty(key)){
                            r[key] = pathTrans(obj[key]);
                        }
                    }
                    return r;
                },
                objTrans2 = function(obj){
                    var 
                        i, len,
                        newKey;
                    for(var key in obj){
                        if(obj.hasOwnProperty(key)){
                            newKey = pathTrans(key);
                            switch(util.type(obj[key])){
                                case 'array':
                                    obj[newKey] = [];
                                    for(i = 0, len = obj[key].length; i < len; i++){
                                        obj[newKey][i] = pathTrans(obj[key][i]);
                                    }
                                    delete obj[key];
                                    break;

                                case 'string':
                                    obj[newKey] = pathTrans(obj[key]);
                                    delete obj[key];
                                    break;
                                default:
                                    break;
                            }
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
                                if(/^(path|global)$/.test(key)){ // 替换 val
                                    obj[key] = objTrans(obj[key]);

                                } else if(/^(concat|copy)$/.test(key)){ // 替换 key, val
                                    objTrans2(obj[key]);

                                } else if(obj[key] === null) {

                                } else {
                                    deep(obj[key]);

                                }
                                break;
                            case 'string':
                                if(/^(src|root)$/.test(key)){ // 替换 string
                                    obj[key] = pathTrans(obj[key]);
                                }
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
            fn.buildServerConfig(function(err, config){ // 创建 server 端 config
                if(err){
                    return util.msg.error(iArgv, 'task error', err);
                }

                next(config);

            });

        }).then(function(config){ // 运行命令
            var workFlowPath = path.join(vars.SERVER_PATH, config.workflow);
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
