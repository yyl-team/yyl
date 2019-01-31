'use strict';
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const util = require('yyl-util');
const print = require('yyl-print');
const extOs = require('yyl-os');
const extFs = require('yyl-fs');


const vars = require('../lib/vars.js');
const extFn = require('../lib/extFn.js');
const log = require('./w-log.js');
const wOpzer = require('./w-optimize.js');

const wCommit = {
  help: function() {
    return print.help({
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
  async step01(iEnv, config) {
    const svnConfig = config.commit.svn[iEnv.sub];
    const gitConfig = config.commit.git;
    const iBranch = iEnv.sub;

    if (!svnConfig) {
      throw `--sub ${iEnv.sub} is not exist`;
    }

    let updatePath = [];
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

    await util.forEach(updatePath, async (iPath) => {
      if (!fs.existsSync(iPath)) {
        log('msg', 'warn', `svn update path not exists: ${iPath}`);
      } else {
        log('msg', 'info', `svn update path: ${iPath}`);
        log('end');
        await extOs.runSpawn('svn update', iPath);
        log('msg', 'success', `svn update finished: ${chalk.yellow(iPath)}`);
      }
    });
    log('msg', 'success', `svn.${iEnv.sub}.udpate paths updated`);

    // update the git.sub.update files
    if (gitConfig.update && gitConfig.update.length) {
      await util.forEach(gitConfig.update, async (iPath) => {
        const mPath = iPath;
        if (!fs.existsSync(mPath)) {
          log('msg', 'warn', `git pull path not exist: ${mPath}`);
        } else {
          log('msg', 'info', `git pull path: ${mPath}`);
          await extOs.runSpawn('git pull', mPath);
          log('msg', 'success', `git pull path finished: ${mPath}`);
        }
      });

      log('msg', 'success', `git.${iEnv.sub} .udpate paths updated`);
    } else {
      log('msg', 'success', `git.${ iEnv.sub } .udpate is blank`);
    }

    if (svnConfig.onBeforeCommit) {
      log('msg', 'info', 'svnConfig.onBeofreCommit task run start');
      await util.makeAwait((next) => {
        svnConfig.onBeforeCommit(iBranch, next);
      });
    } else if (config.onBeforeCommit) {
      log('msg', 'info', 'config.onBeofreCommit task run start');
      await util.makeAwait((next) => {
        config.onBeforeCommit(iBranch, next);
      });
    }
  },
  async copy(iEnv, config) {
    const svnConfig = config.commit.svn[iEnv.sub];

    if (!svnConfig.copy) {
      log('msg', 'warn', 'svnConfig.copy is blank');
      return;
    }

    const iStats = await extFs.copyFiles(svnConfig.copy, (iPath) => {
      const rPath = util.path.relative(vars.PROJECT_PATH, iPath);
      return /\.sass-cache|\.DS_Store|node_modules/.test(rPath);
    });

    iStats.add.forEach((iPath) => {
      log('msg', 'create', iPath);
    });

    iStats.update.forEach((iPath) => {
      log('msg', 'update', iPath);
    });
  },
  async step02(iEnv, config) {
    const svnConfig = config.commit.svn[iEnv.sub];
    const revRelate = path.relative(config.alias.revDest, config.alias.revRoot);
    const assetsPath = [];
    const delFiles = [];

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

        const keepCount = vars.REV_KEEP_COUNT + 1;

        if (files.length >= keepCount) { // 删除最新版本 往下 三个版本以后生成的文件
          oldRevs = files.slice(keepCount);
          keepRevs = files.slice(0, keepCount);
          oldRevs.forEach((oldRev) => {
            const revFile = util.path.join(iPath, oldRev);
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
                delPath = util.path.join(iPath, revRelate, revData[key]);

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
                keepPath = util.path.join(iPath, revRelate, revData[key]);
                if (~delFiles.indexOf(keepPath)) {
                  delFiles.splice(delFiles.indexOf(keepPath), 1);
                }
              }
            }
          });
        }
      });

      await util.forEach(delFiles, async (src) => {
        if (fs.existsSync(src)) {
          if (!iEnv.nosvn) {
            await extOs.runSpawn(`svn del ${path.basename(src)} -q`, path.dirname(src));
          }
          await extFs.removeFiles(src, true);
          log('msg', 'del', src);
        }
      });

      log('msg', 'success', `total ${chalk.yellow.bold(delFiles.length)} files need delete`);
    } else {
      log('msg', 'warn', 'no assetsPath in svn commit');
    }
  },
  async step03(iEnv, config) {
    const svnConfig = config.commit.svn[iEnv.sub];

    await util.forEach(svnConfig.commit, async (iPath) => {
      if (!fs.existsSync(iPath)) {
        log('msg', 'warn', `commit path not exist, continue: ${iPath}`);
        return;
      }
      log('msg', 'info', `start cleanup: ${chalk.yellow(iPath)}`);
      log('end');
      await extOs.runSpawn('svn cleanup', iPath);
      log('msg', 'success', `cleanup finished: ${chalk.yellow(iPath)} `);


      const dirname = path.dirname(iPath);
      const idir = iPath.split(/[\\/]/).pop();
      const cmd = `svn add ${idir} --force`;

      log('msg', 'info', `svn path add start: ${chalk.yellow(dirname)}`);
      log('msg', 'info', `run cmd: ${cmd}`);
      log('end');
      await extOs.runSpawn(cmd, dirname);
      log('msg', 'success', `svn path added finished: ${chalk.yellow(dirname)}`);

      log('msg', 'success', 'svn add path all finished');

      log('msg', 'info', `svn commit start: ${chalk.yellow(iPath)}`);

      await extOs.runSpawn('svn commit -m gulpAutoCommit', iPath);
      log('msg', 'success', `svn commmit finished: ${chalk.yellow(iPath)}`);
    });
  },
  async run (iEnv, configPath) {
    print.fn.cost.start();

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
    print.fn.cost.end();
    log('msg', 'success', `total ${chalk.green.bold(print.fn.cost.format())} ${chalk.yellow.bold(print.timeFormat())}`);

    log('finished', 'all finished');
    return config;
  }
};

module.exports = wCommit;
