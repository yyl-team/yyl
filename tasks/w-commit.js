'use strict';
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');

const util = require('./w-util.js');
const log = require('./w-log.js');
const wOptimize = require('./w-optimize.js');

const fn = {
  logDest: function(iPath) {
    log('msg', fs.existsSync(iPath) ? 'update' : 'create', iPath);
  }
};

const wCommit = {
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
  },
  step01: function(iEnv, config) {
    const svnConfig = config.commit.svn[iEnv.sub];
    const gitConfig = config.commit.git;
    const iBranch = iEnv.sub;

    const runner = (done) => {
      if (!svnConfig) {
        throw new Error(`--sub ${iEnv.sub} is not exist`);
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
            log('msg', 'warn', `svn update path not exists: ${iPath}`);
          } else {
            iPromise.then((next) => {
              log('msg', 'info', `svn update path: ${iPath}`);
              log('end');
              util.runSpawn('svn update', () => {
                log('msg', 'success', `svn update finish: ${iPath}`);
                next();
              }, iPath, true);
            });
          }
        });

        iPromise.then(() => {
          log('msg', 'success', `svn.${iEnv.sub}.udpate paths updated`);
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
              log('msg', 'warn', `git pull path not exist: ${mPath}`);
            } else {
              iPromise.then((next) => {
                log('msg', 'info', `git pull path: ${mPath}`);
                util.runSpawn('git pull', () => {
                  log('msg', 'success', `git pull path finished: ${mPath}`);
                  next();
                }, mPath);
              });
            }
          });
          iPromise.then(() => {
            log('msg', 'success', `git.${iEnv.sub} .udpate paths updated`);
            NEXT();
          });
          iPromise.start();
        } else {
          log('msg', 'success', `git.${ iEnv.sub } .udpate is blank`);
          NEXT();
        }
      }).then(() => {
        if (svnConfig.onBeforeCommit) {
          log('msg', 'info', 'svnConfig.onBeofreCommit task run start');
          svnConfig.onBeforeCommit(iBranch, done);
        } else if (config.onBeforeCommit) {
          log('msg', 'info', 'config.onBeofreCommit task run start');
          config.onBeforeCommit(iBranch, done);
        } else {
          done();
        }
      }).start();
    };
    return new Promise((next) => {
      runner(next);
    });
  },
  copy: function(iEnv, config) {
    const svnConfig = config.commit.svn[iEnv.sub];
    const runner = (done) => {
      if (!svnConfig.copy) {
        log('msg', 'warn', 'svnConfig.copy is blank');
        return done();
      }

      util.copyFiles(svnConfig.copy, (err, files) => {
        if (err) {
          throw new Error(err);
        }
        files.forEach((iPath) => {
          fn.logDest(iPath);
        });

        done(files);
      }, /\.sass-cache|\.DS_Store|node_modules/, null, util.vars.PROJECT_PATH, true);
    };

    return new Promise((next) => {
      runner(next);
    });
  },
  step02: function(iEnv, config) {
    const svnConfig = config.commit.svn[iEnv.sub];
    const revRelate = path.relative(config.alias.revDest, config.alias.revRoot);
    const assetsPath = [];
    const delFiles = [];

    const runner = (done) => {
      svnConfig.commit.forEach((item) => {
        if (/assets/.test(item)) {
          assetsPath.push(item);
        }
      });

      if (assetsPath.length) {
        log('msg', 'info', 'rev svn Path clean start');

        assetsPath.forEach((src) => {
          const iPath = src;
          if (!fs.existsSync(iPath)) {
            log('msg', 'warn', `assets path not exist, break: ${iPath}`);
            return;
          }

          const files = fs.readdirSync(iPath);
          let oldRevs;
          let keepRevs;
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

          const keepCount = util.vars.REV_KEEP_COUNT + 1;

          if (files.length >= keepCount) { // 删除最新版本 往下 三个版本以后生成的文件
            oldRevs = files.slice(keepCount);
            keepRevs = files.slice(0, keepCount);
            oldRevs.forEach((oldRev) => {
              const revFile = util.joinFormat(iPath, oldRev);
              let revData;
              let delPath;

              try {
                revData = require(revFile);
              } catch (er) {
                log('msg', 'warn', `read rev file error, delete it: ${revFile}`);
                return;
              }

              for (let key in revData) {
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
                log('msg', 'warn', `path require error, ignore it: ${util.path.join(iPath, revPath)}`);
                return;
              }


              for (let key in revData) {
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
              const handle = function() {
                if (fs.existsSync(src)) {
                  fs.unlinkSync(src);
                  log('msg', 'del', src);
                }
                next();
              };
              if (iEnv.nosvn) {
                handle();
              } else {
                util.runSpawn(`svn del ${path.basename(src)} -q`, () => {
                  log('msg', 'del', src);
                  handle();
                }, path.dirname(src));
              }
            });
          }
        });

        iPromise.then(() => {
          log('msg', 'success', `total ${delFiles.length} files need delete`);
          return done();
        });
        iPromise.start();
      } else {
        log('msg', 'warn', 'no assetsPath in svn commit');
        return done();
      }
    };
    return new Promise((next) => {
      runner(next);
    });
  },
  step03: function(iEnv, config) {
    const svnConfig = config.commit.svn[iEnv.sub];
    const runner = (done) => {
      const iPromise = new util.Promise();

      svnConfig.commit.forEach((iPath) => {
        if (!fs.existsSync(iPath)) {
          log('msg', 'warn', `commit path not exist, continue: ${iPath}`);
          return;
        }

        iPromise.then((next) => {
          log('msg', 'info', `start cleanup: ${iPath}`);
          log('end');
          util.runSpawn('svn cleanup', () => {
            log('msg', 'success', `cleanup finished: ${iPath} `);
            next();
          }, iPath);
        });

        iPromise.then((next) => {
          var dirname = path.dirname(iPath);
          var idir = iPath.split(/[\\/]/).pop();
          var cmd = `svn add ${idir} --force`;

          log('msg', 'info', `start svn add path: ${dirname}`);
          log('msg', 'info', `run cmd: ${cmd}`);
          log('end');
          util.runSpawn( cmd, () => {
            log('msg', 'success', `svn add path finished: ${dirname}`);
            next();
          }, dirname);
        });


        iPromise.then((next) => {
          log('msg', 'success', 'svn add path all finished');
          next();
        });

        iPromise.then((next) => {
          log('msg', 'info', `start svn commit: ${iPath}`);
          util.runSpawn('svn commit -m gulpAutoCommit', (err) => {
            if (err) {
              return done(err);
            }
            log('msg', 'success', `svn commmit finished: ${iPath}`);
            next();
          }, iPath);
        });
      });

      iPromise.then(() => {
        done();
      });
      iPromise.start();
    };

    return new Promise((next) => {
      runner(next);
    });
  },
  run: function(iEnv) {
    var start = new Date();

    const runner = (done) => {
      new util.Promise((next) => {// optimize
        if (!iEnv.sub) {
          wCommit.help();
          done(null);
        } else {
          next();
        }
      }).then((next) => { // optimize
        iEnv.isCommit = true;
        wOptimize.apply(wOptimize, ['all'].concat(util.envStringify(iEnv).split(' '))).then((config) => {
          next(config);
        }).catch((er) => {
          log('msg', 'error', er);
          log('finish');
        });
      }).then((config, next) => { // svn update
        if (iEnv.nosvn) {
          return next(config);
        }

        log('start', 'commit-step01');
        wCommit.step01(iEnv, config).then(() => {
          log('finish', 'commit step01 finished');
          next(config);
        }).catch((err) => {
          log('msg', 'error', err);
          log('finish');
        });
      }).then((config, next) => { // copy
        log('start', 'commit-copy');
        wCommit.copy(iEnv, config).then(() => {
          log('finish', 'commit-copy finished');
          next(config);
        }).catch((err) => {
          log('msg', 'error', ['commit-copy run error', err]);
          log('finish');
        });
      }).then((config, next) => { // step02
        log('start', 'commit-step02');
        wCommit.step02(iEnv, config).then(() => {
          log('finish', 'commit-step02 finished');
          next(config);
        }).catch((err) => {
          log('msg', 'error', ['commit-step02 run error', err]);
          log('finish');
        });
      }).then((config, next) => { // commit
        if (iEnv.nosvn) {
          return next(config);
        }

        log('start', 'commit-step03');
        wCommit.step03(iEnv, config).then(() => {
          log('finsh', 'commit-step03 finished');
          next(config);
        }).catch((err) => {
          log('msg', 'error', ['commit-step03 run error', err]);
          log('finish');
        });
      }).then((config) => { // optimize
        log('msg', 'success', 'all is finished');
        var cost = new Date() -  start;
        var min = Math.floor(cost / 1000 / 60);
        var sec = Math.floor(cost / 1000) % 60;
        var us = cost % 1000;
        log('msg', 'success', `total ${chalk.cyan(min)} m ${chalk.cyan(sec)} s ${chalk.cyan(us)}ms`);
        log('finish');
        done(config);
      }).start();
    };
    return new Promise((next) => {
      runner(next);
    });
  }
};




module.exports = wCommit;
