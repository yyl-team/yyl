const extFs = require('yyl-fs');
const path = require('path');
const fs = require('fs');
const chai = require('chai');
const expect = chai.expect;

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
const buildCmd = (op) => {
  return `init --silent --name ${op.name} --workflow ${op.workflow} --platform ${op.platform} --init ${op.example} --commitType ${op.commitType}`;
};

SEED.workflows.forEach((workflow) => {
  const seed = SEED.find(workflow);
  ['pc', 'mobile'].forEach((platform) => {
    seed.examples.forEach((example) => {
      wInit.ENV.COMMIT_TYPES.forEach((commitType) => {
        cmds.push(buildCmd({
          name: cmds.length,
          workflow,
          platform,
          example,
          commitType
        }));
      });
    });
  });
});

const YYL_PKG_PATH = path.join(util.vars.BASE_PATH, 'package.json');
const pkgConfig = require(YYL_PKG_PATH);

async function dirCheck (iPath, iEnv) {
  // 检查 config 各项属性是否正确
  const configPath = path.join(iPath, 'config.js');
  expect(fs.existsSync(configPath)).to.equal(true);

  const config = util.requireJs(configPath);
  expect(typeof config).to.equal('object');

  expect(config.version).to.equal(pkgConfig.version);
  expect(config.workflow).to.equal(iEnv.workflow);
  expect(`${config.name}`).to.equal(`${iEnv.name}`);
  expect(config.platform).to.equal(iEnv.platform);

  // 内部文件 config.extend.js
  const extConfigPath = path.join(iPath, 'config.extend.js');
  expect(fs.existsSync(extConfigPath)).to.equal(false);

  // 拷贝的完整性校验
  const readFilter = /\.DS_Store|config\.extend\.js$/;
  const pjFullPaths = await extFs.readFilePaths(iPath);
  const pjRelativePaths = pjFullPaths.map((rPath) => path.relative(iPath, rPath));

  // check commons files completable
  const initCommonPath = path.join(util.vars.BASE_PATH, 'init/commons');
  const fromCommonFullPaths = await extFs.readFilePaths(initCommonPath, readFilter);
  fromCommonFullPaths.map((rPath) => {
    const fPath = path.relative(initCommonPath, rPath);
    expect(pjRelativePaths.indexOf(fPath)).to.not.equal(-1);
  });

  // check commitType completable
  const initCommitTypePath = path.join(util.vars.BASE_PATH, 'init', iEnv.commitType);
  const fromCommitTypeFullPaths = await extFs.readFilePaths(initCommitTypePath, readFilter);
  fromCommitTypeFullPaths.map((rPath) => {
    const fPath = path.relative(initCommitTypePath, rPath);
    expect(pjRelativePaths.indexOf(fPath)).to.not.equal(-1);
  });
}


describe('yyl init test', () => {
  cmds.forEach((cmd, index) => {
    it(cmd, function (done) {
      this.timeout(0);
      async function runner () {
        const initPath = path.join(FRAG_PATH, `${index}`);
        extFs.mkdirSync(initPath);
        await fn.frag.build();

        extFs.mkdirSync(initPath);

        await yyl.run(cmd, initPath);
        await dirCheck(initPath, util.envParse(cmd));

        await fn.frag.destroy();
      }
      runner().then(() => {
        done();
      });
    });
  });
});
