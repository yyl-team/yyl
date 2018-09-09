'use strict';
const path = require('path');
const fs = require('fs');
const inquirer = require('inquirer');

const SEED = require('./w-seed.js');

const chalk = require('chalk');
const extFs = require('yyl-fs');
const util = require('./w-util.js');
const wServer = require('./w-server');
const log = require('./w-log.js');


// 选择倾向
const PREFER = {
  PC: 'gulp-requirejs',
  MOBILE: 'gulp-requirejs'
};

// 平台选择
const PLATFORMS = ['pc', 'mobile'];

// 提交类型
const COMMIT_TYPES = fs.readdirSync(path.join(__dirname, '../init'))
  .filter((name) => {
    return !name.match(/^\.DS_Store|commons$/);
  }).sort((a, b) => {
    const name = 'gitlab-ci';
    if (a === name) {
      return 1;
    } else if (b === name) {
      return -1;
    } else {
      return a.localeCompare(b);
    }
  });

const CONFIG_SUGAR_DATA_REG = /__data\(['"](\w+)["']\)/g;

const fn = {
  // 初始化 最后一步, 公用部分拷贝
  initProject(data) {
    const INIT_COMMON_PATH = path.join(util.vars.INIT_PATH, 'commons');
    const INIT_COMMON_CONFIG_PATH = path.join(INIT_COMMON_PATH, 'config.extend.js');
    const INIT_CUSTOM_PATH = path.join(util.vars.INIT_PATH, data.commitType);
    const INIT_CUSTOM_CONFIG_PATH = path.join(INIT_CUSTOM_PATH, 'config.extend.js');
    const PROJECT_CONFIG_PATH = path.join(util.vars.PROJECT_PATH, 'config.js');

    const runner = (next, reject) => {
      const task01 = extFs.copyFiles(INIT_COMMON_PATH, util.vars.PROJECT_PATH, (iPath) => {
        return INIT_COMMON_CONFIG_PATH != iPath;
      });
      const task02 = extFs.copyFiles(INIT_CUSTOM_PATH, util.vars.PROJECT_PATH, (iPath) => {
        return INIT_CUSTOM_CONFIG_PATH !== iPath;
      });

      Promise.all([task01, task02]).then(() => {
        const dataMap = Object.assign(
          fn.pickUpConfig(INIT_COMMON_CONFIG_PATH, data),
          fn.pickUpConfig(INIT_CUSTOM_CONFIG_PATH, data)
        );

        fn.rewriteConfig(PROJECT_CONFIG_PATH, dataMap).then(() => {
          next();
        }).catch((er) => {
          reject(er);
        });
      }).catch((er) => {
        reject(er);
      });
    };

    return new Promise(runner);
  },
  buildKeyReg(key) {
    return new RegExp(`(// \\+ ${key})([\\w\\W]+)(// \\- ${key})`);
  },
  // 根据特殊注释提取 config 内容
  pickUpConfig(iPath, data) {
    if (!fs.existsSync(iPath)) {
      return {};
    }

    const dataMap = {};
    const keys = ['base', 'setting', 'commit', 'extends'];
    const content = fs.readFileSync(iPath).toString();

    keys.forEach((key) => {
      const reg = fn.buildKeyReg(key);
      content.replace(reg, (str, $1, $2) => {
        dataMap[key] = $2.replace(CONFIG_SUGAR_DATA_REG, (str, d) => {
          return `'${data[d]}'`;
        });
      });
    });

    return dataMap;
  },
  // 重写 config 内容
  rewriteConfig(configPath, dataMap) {
    const runner = (next, reject) => {
      if (!fs.existsSync(configPath)) {
        return reject(`config path not exists ${configPath}`);
      }
      let content = fs.readFileSync(configPath).toString();
      Object.keys(dataMap).forEach((key) => {
        content = content.replace(fn.buildKeyReg(key), (str, $1, $2, $3) => {
          return `${$1}${dataMap[key]}${$3}`;
        });
      });


      fs.writeFile(configPath, content, (err) => {
        if (err) {
          return reject(err);
        }
        next();
      });
    };

    return new Promise(runner);
  }
};


const events = {
  help: function() {
    util.help({
      usage: 'yyl init',
      options: {
        '-h, --help': 'print usage information',
        '-f': 'init forcibly',
        '--name': 'project name',
        '--platform': `platform: ${PLATFORMS.join(' or ')}`,
        '--workflow': 'workflow type',
        '--init': 'workflow init type',
        '--cwd': 'runtime path',
        '--nonpm': 'init without npm install'
      }
    });
    return Promise.resolve(null);
  },
  init: function(op) {
    if (op.silent) {
      wServer.setLogLevel(0, true);
    }
    const runner = (done, reject) => {
      // 信息收集
      new util.Promise(((next) => {
        const data = {};
        const prompt = inquirer.createPromptModule();
        const questions = [];

        if (op.name !== '') {
          data.name = op.name;
        } else {
          questions.push({
            name: 'name',
            message: 'name',
            type: 'input',
            default: util.vars.PROJECT_PATH.split('/').pop()
          });
        }

        if (op.platform && /^pc|mobile$/.test(op.platform)) {
          data.platform = op.platform;
        } else {
          questions.push({
            name: 'platform',
            message: 'platform',
            type: 'list',
            choices: PLATFORMS,
            default: PLATFORMS[0]
          });
        }

        if (questions.length) {
          data.confirm = true;
          prompt(questions, (d) => {
            next(util.extend(data, d));
          });
        } else {
          next(data);
        }
      })).then((data, next) => {
        data.commonPath = util.joinFormat(util.vars.PROJECT_PATH, '../commons').trim();

        next(data);
      }).then((data, next) => { // workflow
        const prompt = inquirer.createPromptModule();
        const questions = [];
        const workflows = SEED.workflows;
        const iQuestion = {
          name: 'workflow',
          type: 'list',
          message: 'workflow',
          choices: workflows
        };

        if (data.platform == 'pc') {
          iQuestion.default = PREFER.PC;
        } else {
          iQuestion.default = PREFER.MOBILE;
        }

        if (op.workflow && ~workflows.indexOf(op.workflow)) {
          data.workflow = op.workflow;
        } else {
          questions.push(iQuestion);
        }

        if (questions.length) {
          data.confirm = true;
          prompt(questions, (d) => {
            next(util.extend(data, d));
          });
        } else {
          next(data);
        }
      }).then((data, next) => { // workflow resetFiles init
        const prompt = inquirer.createPromptModule();
        const questions = [];

        if (data.workflow) {
          const expType = SEED.find(data.workflow).examples;
          if (op.init && ~expType.indexOf(op.init)) {
            data.init = op.init;
          } else if (expType.length == 1) {
            data.init = expType[0];
          } else {
            questions.push({
              name: 'init',
              message: 'workflow init type',
              type: 'list',
              choices: expType,
              default: 'single-project'
            });
          }

          if (questions.length) {
            data.confirm = true;
            prompt(questions, (d) => {
              next(util.extend(data, d));
            });
          } else {
            next(data);
          }
        } else {
          next(data);
        }
      }).then((data, next) => { // commit type
        const prompt = inquirer.createPromptModule();
        const questions = [];
        const iQuestion = {
          name: 'commitType',
          type: 'list',
          message: 'commmit type',
          choices: COMMIT_TYPES,
          default: COMMIT_TYPES[0]
        };

        if (op.commitType && ~COMMIT_TYPES.indexOf(op.commitType)) {
          data.commitType = op.commitType;
        } else {
          questions.push(iQuestion);
        }

        if (questions.length) {
          data.confirm = true;
          prompt(questions, (d) => {
            next(util.extend(data, d));
          });
        } else {
          next(data);
        }
      }).then((data, next) => {
        data.version = util.requireJs(path.join(util.vars.BASE_PATH, 'package.json')).version;

        if (!op.silent && data.confirm) {
          // 基本信息
          console.log([
            '',
            ' project info',
            ' ----------------------------------------',
            ` name             : ${data.name}`,
            ` platform         : ${data.platform}`,
            ` workflow         : ${data.workflow}`,
            ` init             : ${data.init}`,
            ` commit type      : ${data.commitType}`,
            ` yyl version      : ${data.version}`,
            ' ----------------------------------------',
            ` project ${chalk.yellow(data.name)} path initial like this:`,
            ''
          ].join('\n'));
        }

        const prompt = inquirer.createPromptModule();

        if (data.confirm) {
          prompt([{
            name: 'ok',
            message: 'ok?',
            type: 'confirm'
          }], (d) => {
            if (d.ok) {
              next(data);
            }
          });
        } else {
          next(data);
        }
      }).then((data) => {
        const errHandle = (er) => {
          log('msg', 'error', ['init error', er]);
          log('finished');
          reject(er);
        };


        SEED.find(data.workflow).init(data.init, util.vars.PROJECT_PATH)
          .on('start', (type) => {
            log('clear');
            log('start', type);
          })
          .on('clear', () => {
            log('clear');
          })
          .on('msg', (type, argv) => {
            log('msg', type, argv);
          })
          .on('finished', (type) => {
            fn.initProject(data).then(() => {
              log('msg', 'success', ['init finished']);
              log('finish', type);
              if (!op.silent) {
                util.openPath(util.vars.PROJECT_PATH);
              }
              done();
            }).catch(errHandle);
          });
      }).start();
    };
    return new Promise(runner);
  }
};

const r = (iEnv) => {
  if (iEnv.h || iEnv.help) {
    return events.help();
  } else {
    return events.init(iEnv);
  }
};
r.ENV = {
  PLATFORMS,
  COMMIT_TYPES,
  CONFIG_SUGAR_DATA_REG
};

module.exports = r;
