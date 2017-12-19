'use strict';
var 
    color = require('yyl-color'),
    util = require('./w-util.js'),
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
                    '-f': 'init forcibly',
                    '--name': 'project name',
                    '--platform': 'platform: pc or mobile',
                    '--workflow': 'workflow type',
                    '--init': 'workflow init type',
                    '--doc': 'git or svn documents path init'
                }
            });

        },
        init: function(op){

            // 信息收集
            new util.Promise(function(next){

                var 
                    data = {},
                    prompt = inquirer.createPromptModule(),
                    questions = [];

                if(op.name){
                    data.name = op.name;

                } else {
                    questions.push({
                        name: 'name',
                        message: 'name',
                        type: 'input',
                        default: vars.PROJECT_PATH.split('/').pop()
                    });
                    
                }

                if(op.platform && /^pc|mobile$/.test(op.platform)){
                    data.platform = op.platform;

                } else {
                    questions.push({
                        name: 'platform',
                        message: 'platform',
                        type: 'list',
                        choices: ['pc', 'mobile'],
                        default: ['pc']
                    });
                    
                }

                if(questions.length){
                    data.confirm = true;
                    prompt(questions, function(d){
                        next(util.extend(data, d));
                    });
                } else {
                    next(data);
                }

            }).then(function(data, next){
                if(!data.commonPath){
                    data.commonPath = util.joinFormat(vars.PROJECT_PATH, '../commons');
                }

                data.commonPath = data.commonPath.trim();

                next(data);
                

            }).then(function(data, next){ // workflow
                var 
                    prompt = inquirer.createPromptModule(),
                    questions = [],
                    workflows = util.readdirSync(path.join(__dirname, '../init-files'), /^\./),
                    iQuestion = {
                        name: 'workflow',
                        type: 'list',
                        message: 'workflow',
                        choices: workflows
                    };

                if(data.platform == 'pc'){
                    iQuestion.default = 'gulp-requirejs';

                } else {
                    iQuestion.default = 'webpack-vue';
                }

                if(op.workflow && ~workflows.indexOf(op.workflow)){
                    data.workflow = op.workflow;
                } else {
                    questions.push(iQuestion);
                }

                if(questions.length){
                    data.confirm = true;
                    prompt(questions, function(d){
                        next(util.extend(data, d));
                    });
                } else {
                    next(data);
                }

            }).then(function(data, next){ // workflow resetFiles init
                var 
                    prompt = inquirer.createPromptModule(),
                    questions = [];

                if(data.workflow){
                    var 
                        workFlowExpPath = path.join(__dirname, '../examples', data.workflow),
                        expType = [];

                    if(fs.existsSync(workFlowExpPath)){
                        expType = util.readdirSync(workFlowExpPath, /^\./);
                        if(op.workflowInitType && ~expType.indexOf(op.workflowInitType)){
                            data.workflowInitType = op.workflowInitType;

                        } else {
                            questions.push({
                                name: 'init',
                                message: 'workflow init type',
                                type: 'list',
                                choices: expType,
                                default: 'single-project'
                            });
                        }

                        if(questions.length){
                            data.confirm = true;
                            prompt(questions, function(d){
                                next(util.extend(data, d));
                            });

                        } else {
                            next(data);
                        }

                    } else {
                        util.msg.error('file not exist:', workFlowExpPath);
                        next(data);
                    }

                } else {
                    next(data);
                }

            }).then(function(data, next){ // doc reset
                var 
                    prompt = inquirer.createPromptModule(),
                    questions = [],
                    iType = {
                        'git': 'git path (just project)',
                        'svn': 'svn path (full svn)'
                    };

                if(op.initType && iType[op.initType]){
                    data.initType = iType[op.initType];

                } else {
                    questions.push({
                        name: 'doc',
                        message: 'select init type',
                        type: 'list',
                        choices: Object.keys(iType).map(function(key){
                            return iType[key];
                        }),
                        default: iType.git
                    });
                }

                if(questions.length){
                    data.confirm = true;
                    prompt(questions, function(d){
                        next(util.extend(data, d));
                    });

                } else {
                    next(data);
                }

            }).then(function(data, next){

                data.version = util.requireJs(path.join(vars.BASE_PATH, 'package.json')).version;

                // 基本信息
                console.log([
                    '',
                    ' project info',
                    ' ----------------------------------------',
                    ' name             : ' + data.name,
                    ' platform         : ' + data.platform,
                    ' workflow         : ' + (data.workflow || ''),
                    ' init             : ' + (data.init || ''),
                    ' doc              : ' + (data.doc || ''),
                    ' yyl version      : ' + data.version,
                    ' ----------------------------------------',
                    ' project ' + color.yellow(data.name) + ' path initial like this:',
                    ''
                ].join('\n'));

                var buildPaths = [];

                if(/svn/.test(data.doc)){ // svn full path
                    // {$name}/{$branches}/{$subDirs01}/{$subDirs02}/{$subDirs03}
                    var parentDir = util.joinFormat(vars.PROJECT_PATH).split('/').pop();
                    var 
                        name = parentDir == data.name? '': data.name,
                        branches = [ 'branches/commit', 'branches/develop', 'trunk' ],
                        subDirs1 = [], //pc, mobile
                        subDirs2 = ['dist', 'src'],
                        subDirs3 = ['css', 'html', 'images', 'js'];

                    subDirs1.push(data.workflow);


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
                    util.buildTree({
                        frontPath: '',
                        path: path.join(vars.BASE_PATH, 'examples', data.workflow, data.init),
                        dirFilter: /\.svn|\.git|\.sass-cache|node_modules|gulpfile\.js|package\.json|webpack\.config\.js|config\.mine\.js/,
                        dirNoDeep: ['html', 'js', 'css', 'dist', 'images', 'sass', 'components'],
                    });
                }

                var 
                    prompt = inquirer.createPromptModule();

                if(data.confirm){
                    prompt([{
                        name: 'ok',
                        message: 'is it ok?',
                        type: 'confirm'
                    }], function(d){
                        if(d.ok){
                            next(data);
                        }
                    });
                } else {
                    next(data);
                }

            }).then(function(data){
                var 
                    parentDir = util.joinFormat(vars.PROJECT_PATH).split('/').pop(),
                    frontPath = '',
                    initClientFlow = function(dirname, workflowName, initType, done){
                        util.msg.info('init client', workflowName, 'start');

                        var 
                            dirPath;

                        if(~data.doc.indexOf('svn')){
                            dirPath = path.join(frontPath, 'develop', dirname);

                        } else {
                            dirPath = frontPath;
                        }

                        new util.Promise(function(next){ // mk dir front path
                            util.msg.info('make dir...');
                            if(dirPath && !fs.existsSync(dirPath)){
                                util.mkdirSync(dirPath);
                            }

                            var 
                                dirs = dirPath? fs.readdirSync(dirPath): [],
                                noEmpty = false;
                            if(dirs.length){
                                dirs.forEach(function(str){
                                    if(!/^\./.test(str)){
                                        noEmpty = true;
                                    }

                                });
                                if(noEmpty && !op.f){

                                    return done(dirname + ' directory is not empty, init fail');
                                }
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
                                /package\.json|gulpfile\.js|\.DS_Store|\.sass-cache|dist|webpack\.config\.js|config\.mine\.js/g,
                                null,
                                path.join(vars.PROJECT_PATH, frontPath)
                            );
                        }).then(function(next){ // copy readme
                            util.msg.info('copy readme to ', workflowName);
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
                                /package\.json|gulpfile\.js|\.DS_Store|\.sass-cache|dist|webpack\.config\.js|config\.mine\.js|\.babelrc/g,
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

                if(data.workflow){
                    padding += 2;
                    initClientFlow( data.platform, data.workflow, data.init, paddingCheck);
                    wServer.init(data.workflow, paddingCheck);
                }

            }).start();

        }

    };


module.exports = function(){
    var
        iArgv = util.makeArray(arguments),
        op = util.envParse(iArgv.slice(1));

    if(op.h || op.help){
        events.help();

    } else {
        events.init(op);

    }
};
