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
            }).then(function(data, next){ // 询问是否自动搜索本地目录
                var 
                    prompt = inquirer.createPromptModule(),
                    questions = [];

                if(!data.commonPath){
                    questions.push({
                        name: 'autosearch',
                        message: 'do u wanter auto search your common path?',
                        type: 'confirm',
                        default: true
                    });
                    prompt(questions, function(d){
                        data.autosearch = d.autosearch;
                        next(data);

                    });

                } else {
                    next(data);
                }

            }).then(function(data, next){ // 自动查找本地目录下的 common 路径
                var 
                    prompt = inquirer.createPromptModule(),
                    questions = [];

                if(!data.commonPath && data.autosearch){
                    var iRoot = path.parse(vars.PROJECT_PATH).root;
                    var ignoreReg = /node_modules|dist/g;

                    if(!vars.IS_WINDOWS){
                        iRoot = vars.PROJECT_PATH.split('/').slice(0, 3).join('/');
                        ignoreReg = /node_modules|Application|dist|Library/g;
                    }

                    util.msg.info('start find your local common path on disk -', iRoot);

                    var list = util.findPathSync(vars.COMMIN_PATH_LIKE, iRoot, ignoreReg, true);

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
                                util.msg.warn('common path not set', 'use process.cmd()');
                                next(util.extend(data, d));

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
                if(!data.commonPath){
                    data.commonPath = vars.PROJECT_PATH;
                }

                data.commonPath = data.commonPath.trim();
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

            }).then(function(data, next){ // pc workflow
                var 
                    prompt = inquirer.createPromptModule(),
                    questions = [],
                    workflows = util.readdirSync(path.join(__dirname, '../init-files'), /^\./);

                if(~data.platforms.indexOf('pc')){
                    questions.push({
                        name: 'pcWorkflow',
                        message: 'pc workflow',
                        type: 'list',
                        choices: workflows,
                        default: 'gulp-requirejs'
                    });
                    prompt(questions, function(d){
                        next(util.extend(data, d));
                    });

                } else {
                    next(data);
                }

            }).then(function(data, next){ // pc workflow resetFiles
                var 
                    prompt = inquirer.createPromptModule(),
                    questions = [];

                if(data.pcWorkflow){
                    var 
                        workFlowExpPath = path.join(__dirname, '../examples', data.pcWorkflow),
                        expType = [];
                    if(fs.existsSync(workFlowExpPath)){
                        expType = util.readdirSync(workFlowExpPath, /^\./);

                        questions.push({
                            name: 'pcWorkflowInitType',
                            message: 'pc workflow init type',
                            type: 'list',
                            choices: expType,
                            default: 'single-project'
                        });

                        prompt(questions, function(d){
                            next(util.extend(data, d));
                        });

                    } else {
                        util.msg.error('file not exist:', workFlowExpPath);
                        next(data);

                    }

                } else {
                    next(data);
                }



            }).then(function(data, next){ // mobile workflow
                var 
                    prompt = inquirer.createPromptModule(),
                    questions = [],
                    workflows = util.readdirSync(path.join(__dirname, '../init-files'), /^\./);

                if(~data.platforms.indexOf('mobile')){
                    questions.push({
                        name: 'mobileWorkflow',
                        message: 'mobile workflow',
                        type: 'list',
                        choices: workflows,
                        default: 'webpack-vue'
                    });
                    prompt(questions, function(d){
                        next(util.extend(data, d));
                    });

                } else {
                    next(data);
                }

            }).then(function(data, next){ // pc workflow resetFiles
                var 
                    prompt = inquirer.createPromptModule(),
                    questions = [];

                if(data.mobileWorkflow){
                    var 
                        workFlowExpPath = path.join(__dirname, '../examples', data.mobileWorkflow),
                        expType = [];
                    if(fs.existsSync(workFlowExpPath)){
                        expType = util.readdirSync(workFlowExpPath, /^\./);

                        questions.push({
                            name: 'mobileWorkflowInitType',
                            message: 'mobile workflow init type',
                            type: 'list',
                            choices: expType,
                            default: 'single-project'
                        });

                        prompt(questions, function(d){
                            next(util.extend(data, d));
                        });

                    } else {
                        util.msg.error('file not exist:', workFlowExpPath);
                        next(data);

                    }

                } else {
                    next(data);
                }

            }).then(function(data, next){ // init type
                var 
                    prompt = inquirer.createPromptModule(),
                    questions = [];

                questions.push({
                    name: 'initType',
                    message: 'select init type',
                    type: 'list',
                    choices: ['svn path (full svn)', 'git path (just project)']

                });
                prompt(questions, function(d){
                    next(util.extend(data, d));
                });

            }).then(function(data, next){


                // 基本信息
                console.log([
                    '',
                    ' project info',
                    ' ----------------------------------------',
                    ' name             : ' + data.name,
                    ' platforms        : ' + data.platforms,
                    ' pc workflow      : ' + (data.pcWorkflow || ''),
                    ' pc init type     : ' + (data.pcWorkflowInitType || ''),
                    ' mobile workflow  : ' + (data.mobileWorkflow || ''),
                    ' mobile init type : ' + (data.mobileWorkflowInitType || ''),
                    ' ----------------------------------------',
                    ' project ' + color.yellow(data.name) + ' path initial like this:',
                    ''
                ].join('\n'));

                var buildPaths = [];

                if(/svn/.test(data.initType)){ // svn full path
                    // {$name}/{$branches}/{$subDirs01}/{$subDirs02}/{$subDirs03}
                    var parentDir = util.joinFormat(vars.PROJECT_PATH).split('/').pop();
                    var 
                        name = parentDir == data.name? '': data.name,
                        branches = [ 'commit', 'develop', 'trunk' ],
                        subDirs1 = [], //pc, mobile
                        subDirs2 = ['dist', 'src'],
                        subDirs3 = ['css', 'html', 'images', 'js'];

                    if(data.pcWorkflow){
                        subDirs1.push('pc');
                    }

                    if(data.mobileWorkflow){
                        subDirs1.push('mobile');
                    }


                    branches.forEach(function(branch){
                        var iBranch = path.join(name, branch);

                        subDirs1.forEach(function(subDir1){
                            var iSubDir1 = path.join(iBranch, subDir1);

                            subDirs2.forEach(function(subDir2){
                                var iSubDir2;
                                if(branch == 'develop'){
                                    iSubDir2 = path.join(iSubDir1, subDir2);
                                } else {
                                    iSubDir2 = iSubDir1;
                                }

                                subDirs3.forEach(function(subDir3){
                                    var iSubDir3 = path.join(iSubDir2, subDir3);

                                    buildPaths.push(iSubDir3);

                                });

                            });

                        });

                    });

                    util.buildTree({
                        path: name,
                        dirList: buildPaths
                    });

                    data.buildPaths = buildPaths;

                } else { // just project
                    var isFullPath = false;
                    if(data.pcWorkflow && data.mobileWorkflow){
                        isFullPath = true;
                    }

                    if(data.pcWorkflow){

                        util.buildTree({
                            frontPath: path.join(data.name, isFullPath? 'pc': ''),
                            path: path.join(vars.BASE_PATH, 'examples', data.pcWorkflow, data.pcWorkflowInitType),
                            dirFilter: /\.svn|\.git|\.sass-cache|node_modules|gulpfile\.js|package\.json|webpack\.config\.js|config\.mine\.js/,
                            dirNoDeep: ['html', 'js', 'css', 'dist', 'images', 'sass', 'components'],
                            
                        });
                    }
                    if(data.mobileWorkflow){
                        util.buildTree({
                            frontPath: path.join(data.name, isFullPath? 'mobile': ''),
                            path: path.join(vars.BASE_PATH, 'examples', data.mobileWorkflow, data.mobileWorkflowInitType),
                            dirFilter: /\.svn|\.git|\.sass-cache|node_modules|gulpfile\.js|package\.json|webpack\.config\.js|config\.mine\.js/,
                            dirNoDeep: ['html', 'js', 'css', 'dist', 'images', 'sass']
                        });
                    }
                }

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
                    initClientFlow = function(dirname, workflowName, initType, done){
                        util.msg.info('init client', workflowName, 'start');

                        var 
                            dirPath,
                            isFullPath = false;


                        if(~data.initType.indexOf('svn')){
                            dirPath = path.join(frontPath, 'develop', dirname);

                        } else {
                            if(data.pcWorkflow && data.mobileWorkflow){
                                isFullPath = true;
                            }
                            dirPath = path.join(frontPath, isFullPath? dirname: '');
                        }

                        new util.Promise(function(next){ // mk dir front path
                            util.msg.info('make dir...');
                            if(!fs.existsSync(dirPath)){
                                util.mkdirSync(dirPath);
                            }
                            if(fs.readdirSync(dirPath).length && !isForce){
                                done(dirname + ' directory is not empty, init fail');
                                return;
                            }

                            if(data.buildPaths){ // 构建其他文件夹(svn)
                                data.buildPaths.forEach(function(iPath){
                                    util.mkdirSync(iPath);
                                });
                            }

                            util.msg.info('done');
                            next();

                        }).then(function(next){ // copy file to PROJECT_PATH
                            util.msg.info('copy file to ', workflowName);
                            util.copyFiles(
                                path.join(vars.BASE_PATH, 'examples', workflowName, initType),
                                path.join(vars.PROJECT_PATH, dirPath),
                                function(err){
                                    if(err){
                                        return done('copy file error, init fail');
                                    }
                                    util.msg.info('done');
                                    next();
                                },
                                /package\.json|node_modules|gulpfile\.js|\.DS_Store|.sass-cache|dist|webpack\.config\.js|config\.mine\.js/g,
                                null,
                                path.join(vars.PROJECT_PATH, frontPath)
                            );
                        }).then(function(next){ // copy readme
                            util.msg.info('copy readme to ', workflowName);
                            util.copyFiles(
                                path.join(vars.BASE_PATH, 'init-files', workflowName),
                                path.join(vars.PROJECT_PATH, dirPath, 'README.md'),
                                function(err){
                                    if(err){
                                        return done('copy file error, init fail');
                                    }
                                    util.msg.info('done');
                                    next();
                                },
                                /package\.json|node_modules|gulpfile\.js|\.DS_Store|.sass-cache|dist|webpack\.config\.js|config\.mine\.js/g,
                                null,
                                path.join(vars.PROJECT_PATH, frontPath)
                            );
                        
                        }).then(function(next){ // create dist file
                            var iiPath = path.join(vars.PROJECT_PATH, dirPath, 'dist');
                            if(!fs.existsSync(iiPath)){
                                fs.mkdirSync(iiPath);
                            }
                            next();

                        }).then(function(next){ // init configfile
                            util.msg.info('init config...');
                            var configPath = path.join(vars.PROJECT_PATH, dirPath, 'config.js');

                            if(!fs.existsSync(configPath)){
                                util.msg.info('config.js not found');
                                next();
                                return;
                            }

                            var
                                configContent = fs.readFileSync(configPath).toString(),
                                replaceFn = function(str, $1, $2, $3, $4){
                                    if(key == 'commonPath'){
                                        return $2 + util.joinFormat(path.relative(path.join(vars.PROJECT_PATH, dirPath), data[key])) + $4;
                                    } else {
                                        return $2 + data[key] + $4;
                                    }

                                };

                            // 替换 commonPath
                            for(var key in data){
                                configContent = configContent.replace(
                                    new RegExp('(\/\\*\\+'+ key + '\\*/)([\'\"])(.*)([\'\"])(\/\\*\\-'+ key + '\\*\/)', 'g'),
                                    replaceFn
                                );
                            }

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
                    initClientFlow('pc', data.pcWorkflow, data.pcWorkflowInitType, paddingCheck);
                    wServer.init(data.pcWorkflow, paddingCheck);
                }
                if(data.mobileWorkflow){
                    padding += 2;
                    initClientFlow('mobile', data.mobileWorkflow, data.mobileWorkflowInitType, paddingCheck);
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
