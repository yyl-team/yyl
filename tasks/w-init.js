'use strict';
var 
    color = require('../lib/colors'),
    util = require('../lib/yyl-util'),
    vars = util.vars,
    wServer = require('./w-server'),
    path = require('path'),
    fs = require('fs'),
    inquirer = require('inquirer');

var 
    events = {
        help: function(){
            util.help({
                usage: 'yyl init',
                options: {
                    '-h, --help': 'print usage information',
                    '-f': 'init forcibly'
                }
            });

        },
        init: function(isForce){

            // 信息收集
            new util.Promise(function(next){ // 本地存储的 commonPath 数据 获取

                util.msg.newline().info('start run init task');


                var 
                    prompt = inquirer.createPromptModule(),
                    commonPath = wServer.profile('commonPath'),
                    questions = [];
                if(commonPath){
                    questions.push({
                        name: 'ok',
                        message: 'is it your common path? ' + commonPath,
                        type: 'confirm',
                        default: true

                    });
                    prompt(questions, function(d){
                        if(d.ok){
                            next({commonPath: commonPath});
                        } else {
                            next({});
                        }
                    });

                } else {
                    util.msg.info('cannot find the common path in your local profile');
                    next({});

                }

            }).then(function(data, next){ // 自动查找本地目录下的 common 路径
                var 
                    prompt = inquirer.createPromptModule(),
                    questions = [];

                if(!data.commonPath){
                    var iRoot = path.parse(vars.PROJECT_PATH).root;
                    var ignoreReg = /node_modules|dist/g;

                    if(!vars.IS_WINDOWS){
                        iRoot = vars.PROJECT_PATH.split('/').slice(0, 3).join('/');
                        ignoreReg = /node_modules|Application|dist|Library/g;
                    }

                    util.msg.info('start find your local common path on disk -', iRoot);

                    var list = util.findPathSync('commons/pc', iRoot, ignoreReg, true);

                    util.msg.info('finish');

                    util.msg.newline();
                    if(list.length){
                        if(list.length > 1){
                            questions.push({
                                name: 'commonPath',
                                message: 'which is your commons path ?',
                                type: 'list',
                                choices: list,
                                default: list[0]
                            });
                            prompt(questions, function(d){
                                if(!d.commonPath ){
                                    util.msg.error('init fail', 'common path not set');
                                } else {
                                    wServer.profile('commonPath', d.commonPath);
                                    next(util.extend(data, d));
                                }

                            });

                        } else {
                            questions.push({
                                name: 'ok',
                                message: 'is it your common path? ' + list[0],
                                type: 'confirm',
                                default: true

                            });
                            prompt(questions, function(d){
                                if(!d.ok){
                                    util.msg.error('init fail', 'common path not set');
                                } else {
                                    var 
                                        dd = {
                                            commonPath: list[0]
                                        };
                                    wServer.profile('commonPath', dd.commonPath);
                                    next(util.extend(data, dd));
                                }

                            });

                        }

                    } else {
                        util.msg.warn('cannot find your commons path');
                        questions.push({
                            name: 'commonPath',
                            message: 'what is your commons path ?',
                            type: 'input'
                        });

                        prompt(questions, function(d){
                            if(!d.commonPath ){
                                util.msg.error('init fail', 'common path not set');
                            } else {
                                wServer.profile('commonPath', d.commonPath);
                                next(util.extend(data, d));
                            }

                        });

                    }
                    

                } else {
                    next(data);

                }

            }).then(function(data, next){
                var 
                    prompt = inquirer.createPromptModule();

                prompt([
                    {
                        name: 'name',
                        message: 'name',
                        type: 'input',
                        default: vars.PROJECT_PATH.split('/').pop(),

                    }, {
                        name: 'platforms',
                        message: 'platform',
                        type: 'checkbox',
                        choices: ['pc', 'mobile'],
                        default: ['pc']
                    }

                ], function(d){
                    next(util.extend(data, d));
                });

            }).then(function(data, next){
                var 
                    prompt = inquirer.createPromptModule(),
                    questions = [],
                    workflows = fs.readdirSync(path.join(__dirname, '../init-files'));

                if(~data.platforms.indexOf('pc')){
                    questions.push({
                        name: 'pcWorkflow',
                        message: 'pc workflow',
                        type: 'list',
                        choices: workflows,
                        default: 'gulp-requirejs'
                    });
                }
                if(~data.platforms.indexOf('mobile')){
                    questions.push({
                        name: 'mobileWorkflow',
                        message: 'mobile workflow',
                        type: 'list',
                        choices: workflows,
                        default: 'webpack-vue'
                    });

                }
                prompt(questions, function(d){
                    next(util.extend(data, d));
                });
            }).then(function(data, next){
                util.msg.newline().line().info(' project ' + color.yellow(data.name) + ' path initial like this:');

                var printArr = [' '+ data.name];

                if(~data.platforms.indexOf('pc')){
                    printArr = printArr.concat([
                        ' |~ pc',
                        ' |  |- dist',
                        ' |  `~ src',
                        ' |     |+ components',
                        ' |     |+ js',
                        ' |     |+ css',
                        ' |     |+ sass',
                        ' |     |+ images',
                        ' |     |+ html',
                        ' |     |- config.js',
                        ' |     |- config.mine.js',
                        ' |     `- README.md'

                    ]);
                }
                if(~data.platforms.indexOf('mobile')){
                    printArr = printArr.concat([
                        ' |~ mobile',
                        ' |  |- dist',
                        ' |  `~ src',
                        ' |     |+ components',
                        ' |     |+ js',
                        ' |     |+ css',
                        ' |     |+ sass',
                        ' |     |+ images',
                        ' |     |+ html',
                        ' |     |- config.js',
                        ' |     |- config.mine.js',
                        ' |     `- README.md'

                    ]);
                }
                printArr = printArr.concat([
                        ' `~ ...'
                ]);

                console.log(printArr.join('\n'));

                var 
                    prompt = inquirer.createPromptModule();

                prompt( [
                    {
                        name: 'ok',
                        message: 'is it ok?',
                        type: 'confirm'
                    }
                ], function(d){
                    if(d.ok){
                        next(data);
                    }
                });
            }).then(function(data){
                var 
                    parentDir = util.joinFormat(vars.PROJECT_PATH).split('/').pop(),
                    frontPath = '',
                    initClientFlow = function(dirname, workflowName, done){
                        util.msg.info('init client', workflowName, 'start');

                        var dirPath = path.join(frontPath, dirname);

                        new util.Promise(function(next){ // mk dir front path
                            util.msg.info('make dir...');
                            if(!fs.existsSync(dirPath)){
                                util.mkdirSync(dirPath);
                            }
                            if(fs.readdirSync(dirPath).length && !isForce){
                                done(dirname + ' directory is not empty, init fail');
                                return;
                            }
                            util.msg.info('done');
                            next();

                        }).then(function(next){ // copy file to PROJECT_PATH
                            util.msg.info('copy file to ', workflowName);
                            util.copyFiles(
                                path.join(vars.BASE_PATH, 'init-files', workflowName),
                                path.join(vars.PROJECT_PATH, dirPath),
                                function(err){
                                    if(err){
                                        return done('copy file error, init fail');
                                    }
                                    util.msg.info('done');
                                    next();
                                },
                                /package\.json|node_modules|gulpfile\.js|\.DS_Store|.sass-cache|dist/g,
                                null,
                                path.join(vars.PROJECT_PATH, frontPath)
                            );
                        }).then(function(next){ // init configfile
                            util.msg.info('init config...');
                            var configPath = path.join(vars.PROJECT_PATH, dirPath, 'config.js');
                            
                            if(!fs.existsSync(configPath)){
                                util.msg.info('config.js not found');
                                next();
                                return;
                            }

                            var configContent = fs.readFileSync(configPath).toString();

                            // 替换 commonPath
                            configContent = configContent.replace(/(\/\*\+(\w+)\*\/.*['"])([^"']*)(["'].*\/\*\-(\w+)\*\/)/, function(str, $1, $2, $3, $4){
                                var key = $2;

                                if( key in data){
                                    if(key == 'commonPath'){
                                        return $1 + util.joinFormat(path.relative(path.join(vars.PROJECT_PATH, dirPath), data[key])) + $4;

                                    } else {
                                        return $1 + data[key] + $4;
                                    }
                                } else {
                                    return str;
                                }

                            });

                            fs.writeFileSync(configPath, configContent);

                            util.msg.info('done');
                            next();

                        }).then(function(){
                            util.msg.success('init client', workflowName, 'success');
                            done(null, path.join(vars.PROJECT_PATH,dirPath));
                        }).start();
                    };

                if(parentDir !== data.name){ // 如项目名称与父级名称不一致, 创建顶级目录
                    fs.mkdirSync(data.name);
                    frontPath = data.name;
                }

                var padding = 0,
                    iPaths = [],
                    paddingCheck = function(err, currentPath){
                        if(err){
                            util.msg.error(err);
                        } else {
                            if(currentPath){
                                iPaths.push(currentPath);
                            }
                        }
                        padding--;

                        if(!padding){
                            util.msg.line().success(data.name + ' init complete');
                            util.runCMD('yyl');
                            if(iPaths.length){
                                util.openPath(iPaths[0]);
                            }

                        }

                    };
                if(data.pcWorkflow){
                    padding += 2;
                    initClientFlow('pc', data.pcWorkflow, paddingCheck);
                    wServer.init(data.pcWorkflow, paddingCheck);
                }
                if(data.mobileWorkflow){
                    padding += 2;
                    initClientFlow('mobile', data.mobileWorkflow, paddingCheck);
                    wServer.init(data.mobileWorkflow, paddingCheck);
                }

            }).start();

        }

    };


module.exports = function(cmd, ctx){
    switch(ctx){
        case '-h':
        case '--help':
            events.help();
            break;

        case '-f':
            events.init(true);
            break;

        default:
            events.init();
            break;
    }
};
