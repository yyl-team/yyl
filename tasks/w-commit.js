'use strict';
var 
    util = require('yyl-util'),
    vars = require('./w-vars.js'),
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
                wServer.buildConfig(iEnv.name, function(err, config){ // 创建 server 端 config
                    if(err){
                        return done(err);
                    }

                    util.msg.info('build server config success');
                    next(config);

                });

            }).then(function(config){ // check config
                var iConfig = config;

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
            var handle;

            cmd += ' --isCommit';
            util.msg.info('optimize start..');
            util.msg.info('run cmd:', cmd);


            process.chdir(workFlowPath);
            if(vars.IS_WINDOWS){
                handle = util.runCMD;

            } else {
                handle = util.runSpawn;
            }
            handle(cmd, function(err){
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

            if(!svnConfig){
                return done('--sub ' + iEnv.sub + ' is not exist');
            }

            new util.Promise(function(NEXT){ // 删除动态文件
                
                // update 文件
                if(svnConfig.update && svnConfig.update.length){
                    var iPromise = new util.Promise();

                    svnConfig.update.forEach(function(iPath){
                        var mPath = iPath;
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
                        var mPath = iPath;
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
                        var mPath = iPath;
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
            var 
                svnConfig = config.commit.svn[iEnv.sub],
                assetsPath = [],
                delFiles = [],
                revRelate = path.relative(config.alias.revDest, config.alias.revRoot);

            svnConfig.commit.forEach(function(item){
                if(/assets/.test(item)){
                    assetsPath.push(item);
                }
            });

            if(assetsPath.length){
                util.msg.info('rev svn Path clean start');

                assetsPath.forEach(function(src){
                    var iPath = src;
                    
                    if(!fs.existsSync(iPath)){
                        util.msg.warn('assets path not exist, break:', iPath);
                        return;
                    }

                    var files = fs.readdirSync(iPath);
                    var oldRevs;
                    var keepRevs;
                    
                    // 排序
                    files.sort(function(a,b){
                        if(a === 'rev-manifest.json'){
                            return -1;
                        } else if(b == 'rev-manifest.json'){
                            return 1;
                        } else {
                            var 
                                aVer = +a.replace(/rev-manifest-(\d+)\.json/, '$1'),
                                bVer = +b.replace(/rev-manifest-(\d+)\.json/, '$1');


                            return bVer - aVer;
                        }

                    });

                    var keepCount = vars.REV_KEEP_COUNT + 1;

                    if(files.length >= keepCount){ // 删除最新版本 往下 三个版本以后生成的文件 
                        oldRevs = files.slice(keepCount);
                        keepRevs = files.slice(0, keepCount);
                        oldRevs.forEach(function(oldRev){
                            var 
                                revFile = util.joinFormat(iPath, oldRev),
                                revData,
                                delPath;

                            try{
                                revData = require(revFile);

                            } catch(er){
                                util.msg.warn('read rev file error, delete it:', revFile);
                                return;
                            }

                            for(var key in revData){
                                if(revData.hasOwnProperty(key) && key != 'version'){
                                    delPath = util.joinFormat(iPath, revRelate, revData[key]);

                                    if(!~delFiles.indexOf(delPath)){
                                        delFiles.push(delPath);
                                    }
                                }
                            }

                            // 删除对应的 rev-manifest.json
                            if(!~delFiles.indexOf(revFile)){
                                delFiles.push(revFile);
                            }
                        });

                        keepRevs.forEach(function(revPath){ // 保留 最新的 3 个 版本下生成的文件
                            var 
                                revData,
                                keepPath;

                            try{
                                revData = require(path.join(iPath, revPath));

                            } catch(er){
                                util.msg.warn('path require error, ignore it:', path.join(iPath, revPath));
                            }


                            for(var key in revData){
                                if(revData.hasOwnProperty(key) && key != 'version'){
                                    keepPath = util.joinFormat(iPath, revRelate, revData[key]);
                                    if(~delFiles.indexOf(keepPath)){
                                        delFiles.splice(delFiles.indexOf(keepPath), 1);
                                    }
                                }
                            }
                        });
                    }

                });


                var iPromise = new util.Promise();

                delFiles.forEach(function(src){
                    if(fs.existsSync(src)){
                        iPromise.then(function(next){
                            util.msg.del('file:', src);
                            var 
                                handle = function(){
                                    util.msg.success('done');
                                    if(fs.existsSync(src)){
                                        fs.unlinkSync(src);
                                    }
                                    next();

                                };
                            if(iEnv.nosvn){
                                handle();

                            } else {
                                util.runSpawn('svn del ' + path.basename(src) + ' --force', function(){
                                    handle();
                                }, path.dirname(src));

                            }

                        });
                    }
                });

                iPromise.then(function(){
                    util.msg.line();
                    util.msg.success('del file done');
                    util.msg.info('total ' + delFiles.length + ' files need delete');
                    util.msg.success('commit step 02 done');
                    return done();
                });
                iPromise.start();

            } else {
                util.msg.warn('no assetsPath in svn commit');
                return done();
            }
        },
        step03: function(iEnv, config, done){
            var 
                svnConfig = config.commit.svn[iEnv.sub],

                iPromise = new util.Promise();

            svnConfig.commit.forEach(function(iPath){
                if(!fs.existsSync(iPath)){
                    util.msg.warn('commit path not exist, continue:', iPath);
                    return;
                }

                iPromise.then(function(next){
                    util.msg.info('start cleanup:', iPath);
                    util.runSpawn('svn cleanup', function(){
                        util.msg.success('done');
                        next();
                    }, iPath);
                });

                iPromise.then(function(next){
                    var dirname = path.dirname(iPath);
                    var idir = iPath.split(/[\\\/]/).pop();
                    var cmd = 'svn add '+ idir +' --force';

                    util.msg.info('start svn add path:', dirname);
                    util.msg.info('cmd:', cmd);
                    util.runSpawn( cmd, function(){

                        next();
                    }, dirname);
                });


                iPromise.then(function(next){
                    util.msg.success('done');
                    next();
                });

                iPromise.then(function(next){
                    util.msg.info('start svn commit:', iPath);
                    util.runSpawn('svn commit -m gulpAutoCommit', function(){
                        util.msg.success('done');
                        next();
                    }, iPath);
                });
            });

            iPromise.then(function(){
                done();
            });
            iPromise.start();

        },
        run: function(){
            var 
                iEnv = util.envPrase(arguments),
                start = new Date();

            new util.Promise(function(next){// initConfig
                util.msg.info('commit task initConfig start');
                wCommit.initConfig(iEnv, function(err, config){
                    if(err){
                        util.msg.error('commit task initConfig error:', err);
                    } else {
                        next(config);
                    }

                });
            }).then(function(config, next){ // server init

                util.msg.info('commit task server init start');
                wServer.init(config.workflow, function(err){
                    if(err){
                        return util.msg.error('server init error', err);
                    }

                    util.msg.success('commit task server init done');
                    next(config);

                });
            }).then(function(config, next){ // dest clean
                util.msg.info('clean dest start');
                util.removeFiles([config.alias.destRoot], function(err){
                    if(err){
                        return util.msg.error('clean dest fail', err);
                    }

                    util.msg.info('clean dest done');
                    next(config);
                });

            }).then(function(config, next){ // optimize
                util.msg.info('commit task optimize start');
                wCommit.optimize(iEnv, config, function(err){
                    if(err){
                        util.msg.error('commit task optimize error:', err);
                    } else {

                        util.msg.success('commit task optimize done');
                        next(config);
                    }

                });

            }).then(function(config, next){ // update

                if(iEnv.nosvn){
                    return next(config);
                }


                util.msg.info('commit task step01 start');
                wCommit.step01(iEnv, config, function(err){
                    if(err){
                        util.msg.error('commit task step01 error:', err);
                    } else {
                        util.msg.success('commit task step01 done');
                        next(config);
                    }

                });
            }).then(function(config, next){ // copy
                util.msg.info('commit task copy start');
                wCommit.copy(iEnv, config, function(err){
                    if(err){
                        util.msg.error('commit task copy error:', err);
                    } else {
                        util.msg.success('commit task copy done');
                        next(config);
                    }

                });
            }).then(function(config, next){ // step02
                
                util.msg.info('commit task step02 start');

                wCommit.step02(iEnv, config, function(err){
                    if(err){
                        util.msg.error('commit task step02 error:', err);
                    } else {
                        util.msg.success('commit task step02 done');
                        next(config);
                    }

                });
            }).then(function(config, next){ // commit
                if(iEnv.nosvn){
                    return next(config);
                }
                util.msg.info('commit task step03 start');

                wCommit.step03(iEnv, config, function(err){
                    if(err){
                        util.msg.error('commit task step03 error:', err);
                    } else {
                        next(config);
                    }

                });
            }).then(function(){ // optimize
                util.msg.success('all is done');
                var cost = new Date() -  start;
                var min = Math.floor(cost / 1000 / 60);
                var sec = Math.floor(cost / 1000) % 60;
                var us = cost % 1000;
                util.msg.info('total ' + min + ' m ' + sec + ' s ' + us + 'ms');

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
                    '--nosvn': 'commit without svn command',
                    '-h, --help': 'print usage information'
                }
            });

        }

    };


module.exports = wCommit;
