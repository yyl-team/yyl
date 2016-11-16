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
    wInit = function(){

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

                util.msg.info('start find your local common path on disk -', iRoot);

                var list = util.findPathSync('commons/pc', iRoot, /node_modules|\.sass-cache|\.git|\.svn/g);

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
                    if(!fs.existsSync(dirPath)){
                        fs.mkdirSync(dirPath);
                    }
                    if(fs.readdirSync(dirPath).length){
                        done(dirname + ' directory is not empty, init fail');
                        return;
                    }


                    util.copyFiles(
                        path.join(vars.BASE_PATH, 'init-files', workflowName),
                        path.join(vars.PROJECT_PATH, dirPath),
                        function(err){
                            if(err){
                                return done('copy file error, init fail');
                            }
                            util.msg.success('init client', workflowName, 'success');
                            done();
                        },
                        /package\.json|node_modules|gulpfile\.js|\.DS_Store|.sass-cache/g,
                        null,
                        path.join(vars.PROJECT_PATH, frontPath)
                    );
                };

            if(parentDir !== data.name){ // 如项目名称与父级名称不一致, 创建顶级目录
                fs.mkdirSync(data.name);
                frontPath = data.name;
            }

            var padding = 0,
                paddingCheck = function(err){
                    if(err){
                        util.msg.error(err);
                    }
                    padding--;

                    if(!padding){
                        util.msg.line().success(data.name + ' init complete');
                        util.runCMD('yyl');

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

    };

module.exports = wInit;
