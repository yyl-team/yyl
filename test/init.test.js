const extFs = require('yyl-fs');
const path = require('path');
const fs = require('fs');

const yyl = require('../index');
const util = require('../tasks/w-util');
const SEED = require('../tasks/w-seed');
const wInit = require('../tasks/w-init');

const FRAG_PATH = path.join(__dirname, '__frag');
const fn = {
  frag: {
    build() {
      if (fs.existsSync(FRAG_PATH)) {
        return extFs.removeFiles(FRAG_PATH);
      } else {
        return extFs.mkdirSync(FRAG_PATH);
      }
    },
    destroy() {
      return extFs.removeFiles(FRAG_PATH, true);
    },
    here(f, done) {
      new util.Promise((next) => {
        fn.frag.build().then(() => {
          next();
        });
      }).then((next) => {
        f(next);
      }).then(() => {
        fn.frag.destroy().then(() => {
          done();
        });
      }).start();
    }
  }
};

const cmds = [];

SEED.workflows.forEach((workflow) => {
  let cmd = `init --name ${cmds.length} --workflow ${workflow}`;
  const seed = SEED.find(workflow);

  ['pc', 'mobile'].forEach((platform) => {
    cmd = `${cmd} --platform ${platform}`;
    seed.examples.forEach((example) => {
      cmd = `${cmd} --init ${example}`;
      wInit.ENV.COMMIT_TYPES.forEach((commitType) => {
        cmd = `${cmd} --commitType ${commitType}`;
        cmds.push(cmd);
      });
    });
  });
});

const YYL_PKG_PATH = path.join(util.vars.BASE_PATH, 'package.json');
const pkgConfig = require(YYL_PKG_PATH);

async function dirCheck (iPath, iEnv) {
  // 检查 config 各项属性是否正确
  const configPath = path.join(iPath, 'config.js');
  expect(fs.existsSync(configPath)).toBe(true);

  const config = util.requireJs(configPath);
  expect(typeof config).toBe('object');

  expect(config.version).toBe(pkgConfig.version);
  expect(config.workflow).toBe(iEnv.workflow);
  expect(config.name).toBe(iEnv.name);
  expect(config.platform).toBe(iEnv.platform);

  // 内部文件 config.extend.js
  const extConfigPath = path.join(iPath, 'config.extend.js');
  expect(fs.existsSync(extConfigPath)).toBe(false);


  // 拷贝的完整性校验
  const readFilter = /\.DS_Store|config\.extend\.js$/;
  const projectPaths = await extFs.readFilePaths(iPath, readFilter);

  // check commons files completable
  const initCommonPath = path.join(util.vars.BASE_PATH, 'init/commons');
  const fromCommonPaths = await extFs.readFilePaths(initCommonPath, readFilter);

  // check commitType completable
  const initCommitTypePath = path.join(util.vars.BASE_PATH, 'init', iEnv.commitType);
  const fromCommitTypePaths = await extFs.readFilePaths(initCommitTypePath, readFilter);
};

cmds.forEach((cmd, index) => {
  test(cmd, async () => {
    const initPath = path.join(FRAG_PATH, index);
    extFs.mkdirSync(initPath);
    await fn.frag.build();


    await yyl.run(cmd, initPath);
    await dirCheck(initPath, util.envParse(cmd));

    await fn.frag.destroy();
  });
});

