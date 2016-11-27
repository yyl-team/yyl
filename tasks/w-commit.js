'use strict';
var 
    util = require('../lib/yyl-util'),
    vars = util.vars,
    wServer = require('./w-server.js'),
    path = require('path'),
    fs = require('fs');

var 
    wCommit = {
        initConfig: function(iEnv, done){

            new util.Promise(function(next){ // env check
                if(!iEnv.sub){
                    events.help();
                    return done('no sub env');
                }
                next();

            }).then(function(next){ // parse config to server
                wServer.buildConfig(function(err, config){ // 创建 server 端 config
                    if(err){
                        return done(err);
                    }

                    util.msg.info('build server config success');
                    next(config);

                });
            }).then(function(config){ // check config
                var iConfig;
                if(iEnv.name){
                    iConfig = config[iEnv.name];

                } else {
                    iConfig = config;
                }


                if(!iConfig || !iConfig.alias){
                    done('--name is not right or config.js format error');
                    return;

                } else if(!iConfig.workflow) {
                    done('config.js no workflow setting');
                } else {

                    var workFlowPath = path.join(vars.SERVER_WORKFLOW_PATH, config.workflow);
                    if(!fs.existsSync(workFlowPath)){
                        return done('config.js workflow setting is not right');
                    }

                    return done(null, util.initConfig(iConfig));

                }

            }).start();

        },
        optimize: function(iEnv, config, done){
            var workFlowPath = path.join(vars.SERVER_WORKFLOW_PATH, config.workflow);

            if(!fs.existsSync(workFlowPath)){
                return done('config.js workflow setting is not right');
            }

            var cmd = 'gulp all ' + util.envStringify(iEnv);

            cmd += ' --isCommit';
            util.msg.info('optimize start..');
            process.chdir(workFlowPath);
            util.runSpawn(cmd, function(err){
                process.chdir(vars.PROJECT_PATH);
                if(err){
                    return done(err);
                }

                util.msg.success('optimize done!');
                done();

            }, workFlowPath);
        },
        step01: function(iEnv, config, done){

            var 
                svnConfig = config.commit.svn[iEnv.sub],
                gitConfig = config.commit.git,
                iBranch = iEnv.sub;

            util.msg.info('commit step 01 start');
            new util.Promise(function(NEXT){ // 删除动态文件
                // update 文件
                if(svnConfig.update && svnConfig.update.length){
                    var iPromise = new util.Promise();

                    svnConfig.update.forEach(function(iPath){
                        var mPath = path.join(vars.SERVER_WORKFLOW_PATH, config.workflow, iPath);
                        if(!fs.existsSync(mPath)){
                            util.msg.warn('svn update path not exists:', mPath);

                        } else {
                            iPromise.then(function(next){
                                util.msg.info('svn update path:', mPath);
                                util.runSpawn('svn update', function(){
                                    util.msg.info('done');
                                    next();
                                }, mPath, true);
                            });

                        }
                        
                        
                    });
                    iPromise.then(function(){
                        util.msg.info('svn config.udpate is done');
                        NEXT();
                    });
                    iPromise.start();

                } else {
                    util.msg.info('svn config.udpate is blank');
                    NEXT();
                }
            }).then(function(NEXT){ // update git
                // update 文件
                if(gitConfig.update && gitConfig.update.length){
                    var iPromise = new util.Promise();

                    gitConfig.update.forEach(function(iPath){
                        var mPath = path.join(vars.SERVER_WORKFLOW_PATH, config.workflow, iPath);
                        if(!fs.existsSync(mPath)){
                            util.msg.warn('git pull path not exist:', mPath);

                        } else {
                            iPromise.then(function(next){
                                util.msg.info('git pull path:' , mPath);
                                util.runSpawn('git pull', function(){
                                    util.msg.info('done');
                                    next();

                                }, mPath);

                            });
                        }
                    });
                    iPromise.then(function(){
                        util.msg.info('git config.udpate is done');
                        NEXT();
                    });
                    iPromise.start();

                } else {
                    util.msg.info('git config.udpate is blank');
                    NEXT();
                }
                
            }).then(function(next){ // 添加 被删除的文件夹
                var delPath = [];

                // 删除 commit 设置下的文件
                if(svnConfig.commit){
                    svnConfig.commit.forEach(function(iPath){
                        var mPath = path.join(vars.SERVER_WORKFLOW_PATH, config.workflow, iPath);
                        if(!fs.existsSync(mPath)){
                            util.msg.warn('svn commit path not exist:', mPath);

                        } else {
                            delPath.push(mPath);
                        }
                    });
                }

                util.removeFiles(delPath, function(){
                    util.msg.success('svn.update, svn.commit files deleted');
                    next(delPath);
                });

            }).then(function(delPath ,next){ // 添加 被删除的文件夹
                delPath.forEach(function(iPath){
                    if(!path.extname(iPath) && !fs.existsSync(iPath)){
                        util.mkdirSync(iPath);
                    }
                });
                util.msg.info('svn.update, svn.commit files doc added');

                next(delPath);

            }).then(function(delPath ,NEXT){ // update 被删除的文件
                var iPromise = new util.Promise();


                delPath.forEach(function(iPath){
                    iPromise.then(function(next){
                        util.msg.info('svn update ['+ iPath +']');
                        process.chdir(iPath);
                        util.runSpawn('svn update', function(){
                            util.msg.info('done');
                            next();
                        }, util.joinFormat(iPath), true);
                    });
                    
                });

                iPromise.then(function(){
                    util.msg.info('svn.update, svn.commit files updated');
                    NEXT();
                });
                iPromise.start();

            }).then(function(){
                util.msg.success('commit step 01 passed');

                if(svnConfig.onBeforeCommit){
                    util.msg.info('onBeofreCommit task run');
                    svnConfig.onBeforeCommit(iBranch);
                }

                done();

            }).start();

        },
        copy: function(iEnv, config, done){
            var 
                svnConfig = config.commit.svn[iEnv.sub];

            util.msg.info('commit copy start');

            if(!svnConfig.copy){
                util.msg.warn('svnConfig.copy is blank');
                return done();
            }



            util.copyFiles(svnConfig.copy, function(err){
                if(err){
                    return done('copy file fail:', err);
                }

                util.msg.success('commit copy done');
                done();

            }, /\.sass-cache|\.DS_Store|node_modules/, null, vars.PROJECT_PATH);

        },
        step02: function(iEnv, config, done){
            // console.log(iEnv, config, done);

        },
        step03: function(iEnv, config, done){
            // console.log(iEnv, config, done);


        },
        run: function(){
            var 
                iEnv = util.envPrase(arguments);

            new util.Promise(function(next){// initConfig
                wCommit.initConfig(iEnv, function(err, config){
                    if(err){
                        util.msg.error('commit task initConfig error:', err);
                    } else {
                        next(config);
                    }

                });
            }).then(function(config, next){ // optimize

                wServer.init(config.workflow, function(err){
                    if(err){
                        return util.msg.error('server init error', err);
                    }

                    util.msg.success('server init done');
                    next(config);

                }, fs.existsSync(path.join(vars.SERVER_WORKFLOW_PATH, config.workflow, 'node_modules')? true: false));

            }).then(function(config, next){ // optimize
                wCommit.optimize(iEnv, config, function(err){
                    if(err){
                        util.msg.error('commit task optimize error:', err);
                    } else {
                        next(config);
                    }

                });

            }).then(function(config, next){ // update
                wCommit.step01(iEnv, config, function(err){
                    if(err){
                        util.msg.error('commit task step01 error:', err);
                    } else {
                        next(config);
                    }

                });
            }).then(function(config, next){ // optimize
                wCommit.copy(iEnv, config, function(err){
                    if(err){
                        util.msg.error('commit task copy error:', err);
                    } else {
                        next(config);
                    }

                });
            }).then(function(config, next){ // optimize
                wCommit.step02(iEnv, config, function(err){
                    if(err){
                        util.msg.error('commit task step02 error:', err);
                    } else {
                        next(config);
                    }

                });
            }).then(function(config, next){ // optimize
                wCommit.step03(iEnv, config, function(err){
                    if(err){
                        util.msg.error('commit task step03 error:', err);
                    } else {
                        next(config);
                    }

                });
            }).then(function(){ // optimize
                util.msg.success('all is done');

            }).start();

        }
    };

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

        }

    };


module.exports = wCommit;
