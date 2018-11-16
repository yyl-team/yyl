'use strict';
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');

const util = require('./w-util.js');
const log = require('./w-log.js');
const wOpzer = require('./w-optimize.js');
const extFn = require('./w-extFn.js');

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

    const runner = (done, reject) => {
      if (!svnConfig) {
        return reject(`--sub ${iEnv.sub} is not exist`);
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
                log('msg', 'success', `svn update finished: ${chalk.yellow(iPath)}`);
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
    return new Promise(runner);
  },
  copy: function(iEnv, config) {
    const svnConfig = config.commit.svn[iEnv.sub];
    const runner = (done, reject) => {
      if (!svnConfig.copy) {
        log('msg', 'warn', 'svnConfig.copy is blank');
        return done();
      }

      util.copyFiles(svnConfig.copy, (err, files) => {
        if (err) {
          return reject(err);
        }
        files.forEach((iPath) => {
          fn.logDest(iPath);
        });

        done(files);
      }, /\.sass-cache|\.DS_Store|node_modules/, null, util.vars.PROJECT_PATH, true);
    };

    return new Promise(runner);
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
          log('msg', 'success', `total ${chalk.yellow.bold(delFiles.length)} files need delete`);
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
          log('msg', 'info', `start cleanup: ${chalk.yellow(iPath)}`);
          log('end');
          util.runSpawn('svn cleanup', () => {
            log('msg', 'success', `cleanup finished: ${chalk.yellow(iPath)} `);
            next();
          }, iPath);
        });

        iPromise.then((next) => {
          var dirname = path.dirname(iPath);
          var idir = iPath.split(/[\\/]/).pop();
          var cmd = `svn add ${idir} --force`;

          log('msg', 'info', `svn path add start: ${chalk.yellow(dirname)}`);
          log('msg', 'info', `run cmd: ${cmd}`);
          log('end');
          util.runSpawn( cmd, () => {
            log('msg', 'success', `svn path added finished: ${chalk.yellow(dirname)}`);
            next();
          }, dirname);
        });


        iPromise.then((next) => {
          log('msg', 'success', 'svn add path all finished');
          next();
        });

        iPromise.then((next) => {
          log('msg', 'info', `svn commit start: ${chalk.yellow(iPath)}`);
          util.runSpawn('svn commit -m gulpAutoCommit', (err) => {
            if (err) {
              return done(err);
            }
            log('msg', 'success', `svn commmit finished: ${chalk.yellow(iPath)}`);
            next();
          }, iPath);
        });
      });

      iPromise.then(() => {
        done();
      });
      iPromise.start();
    };

    return new Promise(runner);
  },
  async run (iEnv, configPath) {
    const start = new Date();

    // get config
    const config = await extFn.parseConfig(configPath, iEnv);

    if (!config.commit) {
      throw 'commit task run fail, config.commit is not exists';
    }

    if (config.commit.type === 'gitlab-ci') {
      throw 'commit task run fail, please commit with ci';
    }

    if (!iEnv.sub) {
      throw 'commit task run fail, --sub is required';
    }

    // optimize
    iEnv.isCommit = true;
    if (!iEnv.nooptimize) {
      log('finished');
      log('start', 'optimize', 'optimizing...');
      await wOpzer('all', iEnv, configPath, true);
    }

    if (!iEnv.nosvn) {
      log('finished');
      log('start', 'commit-step01', 'svn update');
      await wCommit.step01(iEnv, config);
    }


    log('finished');
    log('start', 'commit-copy');
    await wCommit.copy(iEnv, config);

    log('finished');
    log('start', 'commit-step02', 'rev keep 3 versions');
    await wCommit.step02(iEnv, config);

    if (!iEnv.nosvn) {
      log('finished', 'commit-step02 finished');
      log('start', 'commit-step03', 'svn commit');
      await wCommit.step03(iEnv, config);
    }

    log('msg', 'success', 'all is finished');
    const cost = new Date() -  start;
    const min = Math.floor(cost / 1000 / 60);
    const sec = Math.floor(cost / 1000) % 60;
    const us = cost % 1000;
    log('msg', 'success', `total ${chalk.cyan(min)} m ${chalk.cyan(sec)} s ${chalk.cyan(us)}ms. ${chalk.green(util.getTime())}`);

    log('finished', 'all finished');
    return config;
  }
};




module.exports = wCommit;
