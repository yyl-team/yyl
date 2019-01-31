'use strict';
const path = require('path');
const fs = require('fs');
const inquirer = require('inquirer');
const util = require('yyl-util');
const extFs = require('yyl-fs');

const vars = require('../lib/vars.js');
const SEED = require('./w-seed.js');
const wServer = require('./w-server');
const log = require('./w-log.js');


// 选择倾向
const PREFER = {
  PC: 'gulp-requirejs',
  MOBILE: 'webpack-vue2'
};

// 平台选择
const PLATFORMS = ['pc', 'mobile', 'both'];

// 提交类型
const COMMIT_TYPES = fs.readdirSync(path.join(__dirname, '../init'))
  .filter((name) => {
    return name.match(/^commit-type-/);
  }).map((str) => {
    return str.replace(/^commit-type-/, '');
  }).sort((a, b) => {
    const name = 'gitlab-ci';
    if (a === name) {
      return -1;
    } else if (b === name) {
      return 1;
    } else {
      return a.localeCompare(b);
    }
  });

const CONFIG_SUGAR_DATA_REG = /__data\(['"](\w+)["']\)/g;

const fn = {
  // readme 格式化
  formatREADME(readmePath, extendPath, data) {
    const buildReg = (key) => {
      return new RegExp(`(\\[//\\]: # \\(\\+ ${key}\\))([\\w\\W]+)(\\[//\\]: # \\(- ${key}\\))`);
    };
    const keys = ['title', 'bussiness', 'environment', 'workflow'];
    const pickDataMap = (cnt, data) => {
      let rCnt = `${cnt}`.replace(CONFIG_SUGAR_DATA_REG, (str, $1) => {
        return data[$1] || '';
      });

      let r = {};

      keys.forEach((key) => {
        rCnt.replace(buildReg(key), (str, $1, $2) => {
          r[key] = $2;
        });
      });
      return r;
    };

    const readmeCnt = fs.readFileSync(readmePath).toString();
    const extendCnt = fs.readFileSync(extendPath).toString();

    const readmeMap = pickDataMap(readmeCnt, data);
    const extendMap = pickDataMap(extendCnt, data);

    const rMap = util.extend(readmeMap, extendMap);

    const r = [];

    Object.keys(rMap).forEach((key) => {
      r.push(rMap[key]);
    });

    return Promise.resolve(
      r.join('\n')
        .replace(/[\n]{2,}/g, '\n\n')
        .replace(/^\n/, '')
    );
  },

  // 初始化 最后一步, 公用部分拷贝
  async initProject(data) {
    const pjPath = vars.PROJECT_PATH;
    const fragPath = path.join(pjPath, '__frag');

    const INIT_COMMON_PATH = path.join(vars.INIT_PATH, 'commons');
    const INIT_COMMON_CONFIG_PATH = path.join(INIT_COMMON_PATH, 'config.extend.js');
    const INIT_COMMON_README_PATH = path.join(INIT_COMMON_PATH, 'README.md');

    const INIT_CUSTOM_PATH = path.join(vars.INIT_PATH, `commit-type-${data.commitType}`);
    const INIT_CUSTOM_CONFIG_PATH = path.join(INIT_CUSTOM_PATH, 'config.extend.js');
    const INIT_CUSTOM_README_PATH = path.join(INIT_CUSTOM_PATH, 'README.extend.md');

    const INIT_BOTH_PATH = path.join(vars.INIT_PATH, 'platform-both');

    const initSeed = (param) => {
      return new Promise((next) => {
        SEED.find(param.workflow).init(param.init, pjPath)
          .on('finished', async () => {
            const rConfigPath = path.join(pjPath, 'config.js');
            const yylConfigPath = path.join(pjPath, 'yyl.config.js');
            if (fs.existsSync(rConfigPath)) {
              await extFs.copyFiles(rConfigPath, yylConfigPath);
              await extFs.removeFiles(rConfigPath);
            }
            next();
          });
      });
    };

    // 调整 文件结构 (用于 多个项目)
    const resetFilePaths = async (platform, sameWorkflow) => {
      const srcPath = path.join(pjPath, 'src');
      const configPath = path.join(pjPath, 'yyl.config.js');
      const otherFiles = await extFs.readFilePaths(pjPath, (iPath) => {
        const rPath = path.relative(pjPath, iPath);
        if (
          /^\./.test(path.relative(srcPath, iPath)) &&
          configPath !== iPath &&
          !/__frag/.test(rPath)
        ) {
          return true;
        } else {
          return false;
        }
      });

      // copy src => __frag/src/${platform}
      await extFs.copyFiles(srcPath, path.join(fragPath, `src/${platform}`));

      // copy config.js => __frag/config.${platform}.js
      await extFs.copyFiles(configPath, path.join(fragPath, `yyl.config.${platform}.js`));

      // copy eslintrc, editorconfig => __frag/xx or __frag/src/${platform}/xx
      const otherParam = (() => {
        const r = {};
        otherFiles.forEach((iPath) => {
          if (sameWorkflow) {
            r[iPath] = path.join(fragPath, path.relative(pjPath, iPath));
          } else {
            r[iPath] = path.join(fragPath, `src/${platform}`, path.relative(pjPath, iPath));
          }
        });
        return r;
      })();

      await extFs.copyFiles(otherParam);

      // remove src
      await extFs.removeFiles(srcPath, true);

      // remove config
      await extFs.removeFiles(configPath, true);

      // remove eslint, editorconfig
      await extFs.removeFiles(otherFiles, true);
    };

    const buildDataMap = (platform, dataExtend) => {
      let d = util.extend(true, {}, data);
      delete d.mobile;
      delete d.pc;
      d = Object.assign(d, data[platform]);

      if (dataExtend) {
        d = Object.assign(d, dataExtend);
      }

      return Object.assign(
        fn.pickUpConfig(INIT_COMMON_CONFIG_PATH, d),
        fn.pickUpConfig(INIT_CUSTOM_CONFIG_PATH, d)
      );
    };

    if (data.platform === 'both') {
      const pcParam = data.pc;
      const pcDataMap = buildDataMap('pc', { srcRoot: './src/pc' });
      const mbParam = data.mobile;
      const mbDataMap = buildDataMap('mobile', { srcRoot: './src/mobile' });
      const sameWorkflow = pcParam.workflow === mbParam.workflow;

      // pc 项目初始化
      await initSeed(pcParam);

      // 将生成出来的 src 文件夹里面的内容放到 src/pc 里面
      await resetFilePaths('pc', sameWorkflow);

      // mobile 项目初始化
      await initSeed(mbParam);
      // 将生成出来的 src 文件夹里面的内容放到 src/mobile 里面
      await resetFilePaths('mobile', sameWorkflow);

      // 将 __frag 移动到 根目录
      await extFs.copyFiles(fragPath, pjPath);
      // 删除 __frag 文件
      await extFs.removeFiles(fragPath, true);

      // 初始化 config.pc.js
      const pcConfigPath = path.join(pjPath, 'yyl.config.pc.js');
      await fn.rewriteConfig(pcConfigPath, pcDataMap);

      // 初始化 config.mobile.js
      const mbConfigPath = path.join(pjPath, 'yyl.config.mobile.js');
      await fn.rewriteConfig(mbConfigPath, mbDataMap);
    } else {
      const param = data[data.platform];
      const dataMap = buildDataMap(data.platform, { srcRoot: './src' });
      await initSeed(param);

      // 初始化 config.js
      const configPath = path.join(vars.PROJECT_PATH, 'yyl.config.js');
      await fn.rewriteConfig(configPath, dataMap);
    }

    // svn or ci files init
    await extFs.copyFiles(INIT_CUSTOM_PATH, pjPath, (iPath) => {
      const f = (p) => util.path.join(p);
      // 不拷贝 README.extend.md, config.extend.js
      return f(iPath) != f(INIT_CUSTOM_CONFIG_PATH) && f(iPath) != f(INIT_CUSTOM_README_PATH);
    });

    // common files init
    await extFs.copyFiles(INIT_COMMON_PATH, pjPath, (iPath) => {
      const f = (p) => util.path.join(p);
      // 不拷贝 config.extend.js
      return f(iPath) != f(INIT_COMMON_CONFIG_PATH);
    });


    const readmeCnt = await fn.formatREADME(INIT_COMMON_README_PATH, INIT_CUSTOM_README_PATH, data);
    const readmePath = path.join(pjPath, 'README.md');
    fs.writeFileSync(readmePath, readmeCnt);


    // both files init
    if (data.platform === 'both') {
      await extFs.copyFiles(INIT_BOTH_PATH, pjPath);
    }

    // logs
    const builds = await extFs.readFilePaths(pjPath);
    builds.forEach((iPath) => {
      log('msg', 'create', iPath);
    });
  },
  async initPlatform(platform, iEnv) {
    let data = { platform };
    data = await (async () => {
      const prompt = inquirer.createPromptModule();
      const questions = [];
      const workflows = SEED.workflows;

      const iQuestion = {
        name: 'workflow',
        type: 'list',
        message: `${data.platform} workflow`,
        choices: workflows
      };

      if (data.platform === 'pc') {
        iQuestion.default = PREFER.PC;
      } else {
        iQuestion.default = PREFER.MOBILE;
      }

      const dWorkflow = iEnv[`${data.platform}Workflow`] || iEnv.workflow;

      if (dWorkflow && ~workflows.indexOf(dWorkflow)) {
        data.workflow = dWorkflow;
      } else {
        questions.push(iQuestion);
      }

      if (questions.length) {
        data.confirm = true;
        const d = await prompt(questions);
        util.extend(data, d);
      }
      return data;
    })();
    data = await (async () => {
      const prompt = inquirer.createPromptModule();
      const questions = [];

      if (data.workflow) {
        const expType = SEED.getExamples(data.workflow);
        const dInit = iEnv[`${data.platform}Init`] || iEnv.init;
        if (dInit && ~expType.indexOf(dInit)) {
          data.init = dInit;
        } else if (expType.length == 1) {
          data.init = expType[0];
        } else {
          questions.push({
            name: 'init',
            message: `${data.platform} workflow init type`,
            type: 'list',
            choices: expType,
            default: 'single-project'
          });
        }

        if (questions.length) {
          data.confirm = true;
          const d = await prompt(questions);
          util.extend(data, d);
        }
      }
      return data;
    })();
    return data;
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
    const keys = ['base', 'setting', 'vars', 'commit', 'extends'];
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
  help() {
    const h = {
      usage: 'yyl init',
      options: {
        '--help': 'print usage information',
        '--name': 'project name',
        '--platform': `platform: ${PLATFORMS.join(' or ')}`,
        '--workflow': 'workflow type',
        '--init': 'workflow init type',
        '--cwd': 'runtime path',
        '--nonpm': 'init without npm install'
      }
    };
    util.help(h);
    return Promise.resolve(h);
  },
  async init(iEnv) {
    if (iEnv.silent) {
      wServer.setLogLevel(0, true);
    }

    let data = {};

    // init name, platform
    data = await (async () => {
      const prompt = inquirer.createPromptModule();
      const questions = [];

      if (iEnv.name !== undefined) {
        data.name = `${iEnv.name}`;
      } else {
        questions.push({
          name: 'name',
          message: 'name',
          type: 'input',
          default: vars.PROJECT_PATH.split('/').pop()
        });
      }


      if (iEnv.platform && PLATFORMS.indexOf(iEnv.platform) !== -1) {
        data.platform = iEnv.platform;
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
        const d = await prompt(questions);
        util.extend(data, d);
      }

      return data;
    })();


    // init commonPath, version
    data.commonPath = '../commons';
    data.version = util.requireJs(path.join(vars.BASE_PATH, 'package.json')).version;

    // init pc.init, pc.workflow, mobile.init, mobile.workflow
    let arr = [];
    let confirm = false;

    if (data.platform === 'both') {
      arr = ['pc', 'mobile'];
    } else {
      arr = [data.platform];
    }
    for (var i = 0, len = arr.length; i < len; i++) {
      let platform = arr[i];
      data[platform] = await fn.initPlatform(platform, iEnv);
      if (data[platform].confirm) {
        confirm = true;
      }
    }

    // init commitType
    data = await(async () => {
      const prompt = inquirer.createPromptModule();
      const questions = [];
      const iQuestion = {
        name: 'commitType',
        type: 'list',
        message: 'commmit type',
        choices: COMMIT_TYPES,
        default: COMMIT_TYPES[0]
      };

      if (iEnv.commitType && ~COMMIT_TYPES.indexOf(iEnv.commitType)) {
        data.commitType = iEnv.commitType;
      } else {
        questions.push(iQuestion);
      }

      if (questions.length) {
        data.confirm = true;
        const d = await prompt(questions);
        util.extend(data, d);
      }
      return data;
    })();

    if (!iEnv.silent && confirm) {
      let msgArr = [];
      if (data.platform === 'both') {
        msgArr = [
          '',
          ' project info',
          ' ----------------------------------------',
          ` name             : ${data.name}`,
          ` pc workflow      : ${data.pc.workflow}`,
          ` pc init          : ${data.pc.init}`,
          ` mobile workflow  : ${data.mobile.workflow}`,
          ` mobile init      : ${data.mobile.init}`,
          ` commit type      : ${data.commitType}`,
          ` yyl version      : ${data.version}`,
          ' ----------------------------------------',
          ''
        ];
      } else {
        msgArr = [
          '',
          ' project info',
          ' ----------------------------------------',
          ` name             : ${data.name}`,
          ` platform         : ${data.platform}`,
          ` workflow         : ${data[data.platform].workflow}`,
          ` init             : ${data[data.platform].init}`,
          ` commit type      : ${data.commitType}`,
          ` yyl version      : ${data.version}`,
          ' ----------------------------------------',
          ''
        ];
      }
      console.log(msgArr.join('\n'));
    }

    data = await (async (iData) => {
      const prompt = inquirer.createPromptModule();
      if (data.confirm) {
        const d = await prompt([{
          name: 'ok',
          message: 'ok?',
          type: 'confirm'
        }]);
        if (d.ok) {
          return iData;
        } else {
          return null;
        }
      } else {
        return iData;
      }
    })(data);

    if (!data) {
      return;
    }


    log('clear');
    log('start', 'init');
    await fn.initProject(data);
    log('finish', 'init finished');

    if (!iEnv.silent) {
      util.openPath(vars.PROJECT_PATH);
    }
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

r.help = () => {
  return events.help();
};

module.exports = r;
