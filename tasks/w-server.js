'use strict';
var 
    util = require('../lib/yyl-util'),
    vars = util.vars,
    color = require('../lib/colors'),
    fs = require('fs'),
    path = require('path');

var 
    events = {
        help: function(){
            util.help({
                usage: 'yyl server',
                commands: {
                    '?': '...'
                },
                options: {
                    '-h, --help': 'print usage information',
                    '--p, --path': 'show the yyl server local path'
                }
            });

        },
        path: function(){
            console.log([
                '',
                'yyl server path:',
                color.yellow(vars.SERVER_PATH),
                ''
            ].join('\n'));

            util.openPath(vars.SERVER_PATH);
        },
        init: function(workflowName){
            wServer.init(workflowName, function(err){
                if(err){
                    util.msg.error(err);
                }
            });

        },
        
        // 服务器清空
        clear: function(){
            new util.Promise(function(next){ // clear data file
                util.msg.info('start clear server data path');
                if(fs.existsSync(vars.SERVER_DATA_PATH)){
                    util.removeFiles(vars.SERVER_DATA_PATH, function(){
                        util.msg.info('done');
                        next();

                    });
                } else {
                    util.msg.info('done');
                    next();
                }
            }).then(function(next){ // clear lib
                util.msg.info('start clear server lib');
                if(fs.existsSync(vars.SERVER_LIB_PATH)){
                    util.removeFiles(vars.SERVER_LIB_PATH, function(){
                        util.msg.info('done');
                        next();

                    });
                } else {
                    util.msg.info('done');
                    next();
                }

            }).then(function(NEXT){ // clear workflowFile
                util.msg.info('start clear server workflow path');
                if(fs.existsSync(vars.SERVER_WORKFLOW_PATH)){
                    var iPromise = new util.Promise();
                    fs.readdirSync(vars.SERVER_WORKFLOW_PATH).forEach(function(str){
                        var 
                            iPath = util.joinFormat(vars.SERVER_WORKFLOW_PATH, str),
                            nodeModulePath = util.joinFormat(iPath, 'node_modules');
                        if(fs.existsSync(nodeModulePath)){
                            fs.readdirSync(nodeModulePath).forEach(function(pkgName){
                                if(/\.bin/.test(pkgName)){
                                    return;
                                }
                                iPromise.then(function(next){
                                    util.runCMD('npm uninstall ' + pkgName, function(){
                                        next();
                                    }, iPath);
                                });
                            });
                        }

                    });

                    iPromise.then(function(){
                        util.msg.info('done');
                        NEXT();
                    });
                    iPromise.start();

                } else {
                    util.msg.info('done');
                    NEXT();

                }
            }).then(function(){
                util.msg.success('clear task done');


            }).start();

        }
    };

var 
    wServer = {
        // 获取
        profile: function(key, val){
            var 
                iPath = util.joinFormat(vars.SERVER_DATA_PATH, 'profile.js'),
                data = {};

            if(util.type(key) == 'object'){
                util.mkdirSync(path.dirname(iPath));
                data = data;
                fs.writeFileSync(iPath, JSON.stringify(data, null, 4));
                return data;
            }

            if(fs.existsSync(iPath)){
                try{
                    data = JSON.parse(fs.readFileSync(iPath, 'utf8'));
                } catch(er){}
            }


            if(key === undefined && val === undefined){
                return data;
            }
            
            if(!key){
                return;
            }

            if(val !== undefined){ //set
                console.log(path.dirname(iPath));
                util.mkdirSync(path.dirname(iPath));
                data[key] = val;
                fs.writeFileSync(iPath, JSON.stringify(data, null, 4));
                return val;

            } else { // get
                return data[key];
            }

        },
        // 构建 服务端 config
        buildConfig: function(done){
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

        },
        // 服务器目录初始化
        init: function(workflowName, done){

            util.msg.info('init server', workflowName, 'start');
            if(!workflowName){
                return done('workflow is empty');
            }

            var 
                workflowPath = path.join(vars.SERVER_WORKFLOW_PATH, workflowName),
                workflowBasePath = path.join(vars.BASE_PATH, 'init-files', workflowName);

            if(!fs.existsSync(workflowBasePath)){
                return done(workflowName + ' isnot the right command');
            }

            new util.Promise(function(next){ // server init

                util.mkdirSync(vars.SERVER_PATH);
                util.mkdirSync(workflowPath);

                // copy the lib to server
                util.copyFiles( path.join(vars.BASE_PATH, 'lib'), path.join(vars.SERVER_PATH, 'lib'), function(){
                    util.msg.info('copy lib to serverpath pass');
                    next();
                });

            }).then(function(next){ // copy files to server
                var files = [],
                    fileParam = {};

                switch(workflowName){
                    case 'gulp-requirejs':
                    case 'webpack-vue':
                        files = ['package.json', 'gulpfile.js'];
                        break;

                    default:
                        files = ['package.json'];
                        break;
                }
                files.forEach(function(filePath){
                    fileParam[path.join(vars.BASE_PATH, 'init-files', workflowName, filePath)] = path.join(workflowPath, filePath);
                });

                util.copyFiles(fileParam, function(err){
                    if(err){
                        util.msg.error('copy', workflowName, 'files to serverpath fail', err);
                        return;
                    }
                    util.msg.info('copy', workflowName, 'files to serverpath pass');
                    next();
                });

            }).then(function(next){ // npm install 
                process.chdir(workflowPath);
                util.runCMD('npm install', function(err){
                    if(err){
                        util.msg.error('npm install fail on server!');
                        return;
                    }
                    util.msg.info('npm install success');
                    process.chdir(vars.PROJECT_PATH);
                    next();

                }, workflowPath);


            }).then(function(next){ // back to dirPath
                util.msg.success('init server', workflowName, 'success');
                if(done){
                    done();
                }
                next();
            }).start();

        },
        // yyl 脚本调用 入口
        run: function(){
            var
                iArgv = util.makeArray(arguments),
                ctx = iArgv[1];

            switch(ctx){
                case '--path':
                case '--p':
                    events.path();
                    break;

                case 'clear':
                    events.clear();
                    break;

                case 'init':
                    events.init.apply(events, iArgv.slice(2));
                    break;

                case '--h':
                case '--help':
                    events.help();
                    break;

                default:
                    events.help();
                    break;
            }

        },
        
    };

module.exports = wServer;
