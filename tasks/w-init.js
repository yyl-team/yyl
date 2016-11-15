'use strict';
var 
    color = require('../lib/colors'),
    util = require('../lib/yyl-util'),
    vars = util.vars,
    path = require('path'),
    fs = require('fs'),
    inquirer = require('inquirer');


var 
    wInit = function(){
        // 信息收集
        new util.Promise(function(next){
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

            ], next);

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
            console.log([
                '',
                '-------------------',
                ' project ' + color.yellow(data.name) + ' path initial like this:',
                ''
            ].join('\n'));
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
                },
                initServerPackage = function(workflowName, done){
                    var workflowPath = path.join(vars.SERVER_WORKFLOW_PATH, workflowName);

                    new util.Promise(function(next){ // server init

                        util.msg.info('init server', workflowName, 'start');

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
                initServerPackage(data.pcWorkflow, paddingCheck);
            }
            if(data.mobileWorkflow){
                padding += 2;
                initClientFlow('mobile', data.mobileWorkflow, paddingCheck);
                initServerPackage(data.mobileWorkflow, paddingCheck);
            }

        }).start();

    };

module.exports = wInit;
