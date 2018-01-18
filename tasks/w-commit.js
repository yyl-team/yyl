'use strict';
var path = require('path');
var fs = require('fs');

var util = require('./w-util.js');
var vars = util.vars;
var wServer = require('./w-server.js');


var wCommit = {
  initConfig: function(iEnv, done) {
    new util.Promise(((next) => { // env check
      if (!iEnv.sub) {
        events.help();
        return done('no sub env');
      }
      next();
    })).then((next) => { // parse config to server
      wServer.buildConfig(iEnv.name, iEnv, (err, config) => { // 创建 server 端 config
        if (err) {
          return done(err);
        }

        util.msg.info('build server config success');
        next(config);
      });
    }).then((config) => { // check config
      var iConfig = config;

      if (!iConfig || !iConfig.alias) {
        done('--name is not right or config.js format error');
        return;
      } else if (!iConfig.workflow) {
        done('config.js no workflow setting');
      } else {
        var workFlowPath = path.join(vars.SERVER_WORKFLOW_PATH, config.workflow);
        if (!fs.existsSync(workFlowPath)) {
          return done('config.js workflow setting is not right');
        }

        return done(null, util.initConfig(iConfig));
      }
    }).start();
  },
  optimize: function(iEnv, config, done) {
    var workFlowPath = path.join(vars.SERVER_WORKFLOW_PATH, config.workflow);

    if (!fs.existsSync(workFlowPath)) {
      return done('config.js workflow setting is not right');
    }

    var cmd = `gulp all ${  util.envStringify(iEnv)}`;

    cmd += ' --isCommit';
    util.msg.info('optimize start..');
    util.msg.info('run cmd:', cmd);


    process.chdir(workFlowPath);
    util.runNodeModule(cmd, (err) => {
      process.chdir(vars.PROJECT_PATH);
      if (err) {
        return done(err);
      }

      util.msg.success('optimize done!');
      done();
    }, {
      cwd: workFlowPath,
      nodeBinPath: util.joinFormat(workFlowPath, 'node_modules', '.bin')
    });
  },
  step01: function(iEnv, config, done) {
    var svnConfig = config.commit.svn[iEnv.sub];
    var gitConfig = config.commit.git;
    var iBranch = iEnv.sub;

    if (!svnConfig) {
      return done(`--sub ${  iEnv.sub  } is not exist`);
    }

    new util.Promise(((NEXT) => { // update the svn.sub.update & svn.sub.commit files
      var updatePath = [];

      if (svnConfig.update && svnConfig.update.length) {
        updatePath = updatePath.concat(svnConfig.update);
      }

      if (svnConfig.commit && svnConfig.commit.length) {
        svnConfig.commit.forEach((iPath) => {
          if (!~updatePath.indexOf(iPath)) {
            updatePath.push(iPath);
          }
        });
      }

      var iPromise = new util.Promise();
      updatePath.forEach((iPath) => {
        if (!fs.existsSync(iPath)) {
          util.msg.warn('svn update path not exists:', iPath);
        } else {
          iPromise.then((next) => {
            util.msg.info('svn update path:', iPath);
            util.runSpawn('svn update', () => {
              util.msg.info('done');
              next();
            }, iPath, true);
          });
        }
      });

      iPromise.then(() => {
        util.msg.info( `svn.${  iEnv.sub  }.udpate paths updated`);
        NEXT();
      });

      iPromise.start();
    })).then((NEXT) => { // update the git.sub.update files
      // update 文件
      if (gitConfig.update && gitConfig.update.length) {
        var iPromise = new util.Promise();

        gitConfig.update.forEach((iPath) => {
          var mPath = iPath;
          if (!fs.existsSync(mPath)) {
            util.msg.warn('git pull path not exist:', mPath);
          } else {
            iPromise.then((next) => {
              util.msg.info('git pull path:', mPath);
              util.runSpawn('git pull', () => {
                util.msg.info('done');
                next();
              }, mPath);
            });
          }
        });
        iPromise.then(() => {
          util.msg.info(`git.${ iEnv.sub } .udpate paths updated`);
          NEXT();
        });
        iPromise.start();
      } else {
        util.msg.info(`git.${ iEnv.sub } .udpate is null`);
        NEXT();
      }
    }).then(() => {
      util.msg.success('commit step 01 passed');

      if (svnConfig.onBeforeCommit) {
        util.msg.info('svnConfig.onBeofreCommit task run');
        svnConfig.onBeforeCommit(iBranch, done);
      } else if (config.onBeforeCommit) {
        util.msg.info('config.onBeofreCommit task run');
        config.onBeforeCommit(iBranch, done);
      } else {
        done();
      }
    }).start();
  },
  copy: function(iEnv, config, done) {
    var
      svnConfig = config.commit.svn[iEnv.sub];

    if (!svnConfig.copy) {
      util.msg.warn('svnConfig.copy is blank');
      return done();
    }



    util.copyFiles(svnConfig.copy, (err) => {
      if (err) {
        return done('copy file fail:', err);
      }

      util.msg.success('commit copy done');
      done();
    }, /\.sass-cache|\.DS_Store|node_modules/, null, vars.PROJECT_PATH);
  },
  step02: function(iEnv, config, done) {
    var svnConfig = config.commit.svn[iEnv.sub];
    var assetsPath = [];
    var delFiles = [];
    var revRelate = path.relative(config.alias.revDest, config.alias.revRoot);

    svnConfig.commit.forEach((item) => {
      if (/assets/.test(item)) {
        assetsPath.push(item);
      }
    });

    if (assetsPath.length) {
      util.msg.info('rev svn Path clean start');

      assetsPath.forEach((src) => {
        var iPath = src;
        if (!fs.existsSync(iPath)) {
          util.msg.warn('assets path not exist, break:', iPath);
          return;
        }

        var files = fs.readdirSync(iPath);
        var oldRevs;
        var keepRevs;
        // 排序
        files.sort((a, b) => {
          if (a === 'rev-manifest.json') {
            return -1;
          } else if (b == 'rev-manifest.json') {
            return 1;
          } else {
            var aVer = +a.replace(/rev-manifest-(\d+)\.json/, '$1');
            var bVer = +b.replace(/rev-manifest-(\d+)\.json/, '$1');


            return bVer - aVer;
          }
        });

        var keepCount = vars.REV_KEEP_COUNT + 1;

        if (files.length >= keepCount) { // 删除最新版本 往下 三个版本以后生成的文件 
          oldRevs = files.slice(keepCount);
          keepRevs = files.slice(0, keepCount);
          oldRevs.forEach((oldRev) => {
            var revFile = util.joinFormat(iPath, oldRev);
            var revData;
            var delPath;

            try {
              revData = require(revFile);
            } catch (er) {
              util.msg.warn('read rev file error, delete it:', revFile);
              return;
            }

            for (var key in revData) {
              if (revData.hasOwnProperty(key) && key != 'version') {
                delPath = util.joinFormat(iPath, revRelate, revData[key]);

                if (!~delFiles.indexOf(delPath)) {
                  delFiles.push(delPath);
                }
              }
            }

            // 删除对应的 rev-manifest.json
            if (!~delFiles.indexOf(revFile)) {
              delFiles.push(revFile);
            }
          });

          keepRevs.forEach((revPath) => { // 保留 最新的 3 个 版本下生成的文件
            var revData;
            var keepPath;

            try {
              revData = require(path.join(iPath, revPath));
            } catch (er) {
              util.msg.warn('path require error, ignore it:', path.join(iPath, revPath));
            }


            for (var key in revData) {
              if (revData.hasOwnProperty(key) && key != 'version') {
                keepPath = util.joinFormat(iPath, revRelate, revData[key]);
                if (~delFiles.indexOf(keepPath)) {
                  delFiles.splice(delFiles.indexOf(keepPath), 1);
                }
              }
            }
          });
        }
      });


      var iPromise = new util.Promise();

      delFiles.forEach((src) => {
        if (fs.existsSync(src)) {
          iPromise.then((next) => {
            util.msg.del('file:', src);
            var
              handle = function() {
                util.msg.success('done');
                if (fs.existsSync(src)) {
                  fs.unlinkSync(src);
                }
                next();
              };
            if (iEnv.nosvn) {
              handle();
            } else {
              util.runSpawn(`svn del ${  path.basename(src)}`, () => {
                handle();
              }, path.dirname(src));
            }
          });
        }
      });

      iPromise.then(() => {
        util.msg.line();
        util.msg.success('del file done');
        util.msg.info(`total ${  delFiles.length  } files need delete`);
        util.msg.success('commit step 02 done');
        return done();
      });
      iPromise.start();
    } else {
      util.msg.warn('no assetsPath in svn commit');
      return done();
    }
  },
  step03: function(iEnv, config, done) {
    var svnConfig = config.commit.svn[iEnv.sub];
    var iPromise = new util.Promise();

    svnConfig.commit.forEach((iPath) => {
      if (!fs.existsSync(iPath)) {
        util.msg.warn('commit path not exist, continue:', iPath);
        return;
      }

      iPromise.then((next) => {
        util.msg.info('start cleanup:', iPath);
        util.runSpawn('svn cleanup', () => {
          util.msg.success('done');
          next();
        }, iPath);
      });

      iPromise.then((next) => {
        var dirname = path.dirname(iPath);
        var idir = iPath.split(/[\\/]/).pop();
        var cmd = `svn add ${ idir  } --force`;

        util.msg.info('start svn add path:', dirname);
        util.msg.info('cmd:', cmd);
        util.runSpawn( cmd, () => {
          next();
        }, dirname);
      });


      iPromise.then((next) => {
        util.msg.success('done');
        next();
      });

      iPromise.then((next) => {
        util.msg.info('start svn commit:', iPath);
        util.runSpawn('svn commit -m gulpAutoCommit', (err) => {
          if (err) {
            return done(err);
          }
          util.msg.success('done');
          next();
        }, iPath);
      });
    });

    iPromise.then(() => {
      done();
    });
    iPromise.start();
  },
  run: function() {
    var iEnv = util.envPrase(arguments);
    var start = new Date();

    new util.Promise(((next) => {// initConfig
      util.msg.info('commit task initConfig start');
      wCommit.initConfig(iEnv, (err, config) => {
        if (err) {
          util.msg.error('commit task initConfig error:', err);
        } else {
          next(config);
        }
      });
    })).then((config, next) => { // server init
      util.msg.info('commit task server init start');
      wServer.init(config.workflow, (err) => {
        if (err) {
          return util.msg.error('server init error', err);
        }

        util.msg.success('commit task server init done');
        next(config);
      });
    }).then((config, next) => { // dest clean
      util.msg.info('commit task clean dest start');
      if (iEnv.nooptimize) {
        util.msg.info('skip commit task clean dest');
        return next(config);
      }
      util.removeFiles([config.alias.destRoot], (err) => {
        if (err) {
          return util.msg.error('commit task clean dest fail', err);
        }

        util.msg.info('commit task clean dest done');
        next(config);
      });
    }).then((config, next) => { // optimize
      util.msg.info('commit task optimize start');
      if (iEnv.nooptimize) {
        util.msg.info('skip commit task optimize');
        return next(config);
      }
      wCommit.optimize(iEnv, config, (err) => {
        if (err) {
          util.msg.error('commit task optimize error:', err);
        } else {
          util.msg.success('commit task optimize done');
          next(config);
        }
      });
    }).then((config, next) => { // update
      if (iEnv.nosvn) {
        return next(config);
      }


      util.msg.info('commit task step01 start');
      wCommit.step01(iEnv, config, (err) => {
        if (err) {
          util.msg.error('commit task step01 error:', err);
        } else {
          util.msg.success('commit task step01 done');
          next(config);
        }
      });
    }).then((config, next) => { // copy
      util.msg.info('commit task copy start');
      wCommit.copy(iEnv, config, (err) => {
        if (err) {
          util.msg.error('commit task copy error:', err);
        } else {
          util.msg.success('commit task copy done');
          next(config);
        }
      });
    }).then((config, next) => { // step02
      util.msg.info('commit task step02 start');

      wCommit.step02(iEnv, config, (err) => {
        if (err) {
          util.msg.error('commit task step02 error:', err);
        } else {
          util.msg.success('commit task step02 done');
          next(config);
        }
      });
    }).then((config, next) => { // commit
      if (iEnv.nosvn) {
        return next(config);
      }
      util.msg.info('commit task step03 start');

      wCommit.step03(iEnv, config, (err) => {
        if (err) {
          util.msg.error('commit task step03 error:', err);
        } else {
          next(config);
        }
      });
    }).then(() => { // optimize
      util.msg.success('all is done');
      var cost = new Date() -  start;
      var min = Math.floor(cost / 1000 / 60);
      var sec = Math.floor(cost / 1000) % 60;
      var us = cost % 1000;
      util.msg.info(`total ${  min  } m ${  sec  } s ${  us  }ms`);
    }).start();
  }
};

var
  events = {
    help: function() {
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
          '--nooptimize': 'commit skip the optimize task, run svn cmd',
          '-h, --help': 'print usage information'
        }
      });
    }

  };


module.exports = wCommit;
