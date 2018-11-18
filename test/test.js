const extFs = require('yyl-fs');
const frp = require('yyl-file-replacer');
const path = require('path');
const fs = require('fs');
const chai = require('chai');
const expect = chai.expect;
const http = require('http');

const yyl = require('../index');
const util = require('../tasks/w-util');
const SEED = require('../tasks/w-seed');
const wInit = require('../tasks/w-init');
const extFn = require('../tasks/w-extFn.js');

const FRAG_PATH = path.join(__dirname, '__frag');
const fn = {
  makeAsync: function (fn) {
    const r = function (done) {
      this.timeout(0);
      fn().then(() => {
        done();
      });
    };
    return r;
  },
  get: function (url) {
    return new Promise((next) => {
      http.get(url, (res) => {
        next(res);
      });
    });
  },
  hideUrlTail: function(url) {
    return url
      .replace(/\?.*?$/g, '')
      .replace(/#.*?$/g, '');
  },
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

const TEST_CTRL = {
  SERVER: true,
  VERSION: true,
  HELP: true,
  PATH: true,
  INFO: true,
  MOCK: true,
  INIT: true,
  ALL: true,
  COMMIT: true
};

if (TEST_CTRL.SERVER) {
  describe('yyl server test', () => {
    it('yyl server --help', fn.makeAsync(async () => {
      const h = await yyl.run('server --help --silent', __dirname);
      expect(h).not.equal(undefined);
    }));

    it('yyl server start', fn.makeAsync(async () => {
      const setting = await yyl.run('server start --logLevel 0 --silent', __dirname);
      expect(setting.localserver).not.equal(false);
      const testPath = `http://${util.vars.LOCAL_SERVER}:${setting.localserver.port}/test.js`;
      const res = await fn.get(testPath);
      expect(res.statusCode).equal(200);
      await yyl.run('server abort');
    }));

    it(`yyl server start --path ${__dirname}`, fn.makeAsync(async () => {
      const setting = await yyl.run(`server start --logLevel 0 --silent --path ${__dirname}`);
      expect(setting.localserver).not.equal(false);
      const testPath = `http://${util.vars.LOCAL_SERVER}:${setting.localserver.port}/test.js`;
      const res = await fn.get(testPath);
      expect(res.statusCode).equal(200);
      await yyl.run('server abort');
    }));

    it('yyl server start --path ./', fn.makeAsync(async () => {
      const setting = await yyl.run('server start --logLevel 0 --silent --path ./', __dirname);
      expect(setting.localserver).not.equal(false);
      const testPath = `http://${util.vars.LOCAL_SERVER}:${setting.localserver.port}/test.js`;
      const res = await fn.get(testPath);
      expect(res.statusCode).equal(200);
      await yyl.run('server abort');
    }));

    it('yyl server -p', fn.makeAsync(async () => {
      const iPath = await yyl.run('server -p --silent', __dirname);
      expect(iPath).to.equal(util.vars.SERVER_PATH);
    }));

    it('yyl server --path', fn.makeAsync(async () => {
      const iPath = await yyl.run('server --path --silent', __dirname);
      expect(iPath).to.equal(util.vars.SERVER_PATH);
    }));
  });
}

if (TEST_CTRL.VERSION) {
  describe('yyl -v test', () => {
    it('yyl -v', fn.makeAsync(async () => {
      const v = await yyl.run('yyl -v --silent');
      expect(v).not.equal(undefined);
    }));
    it('yyl --version', fn.makeAsync(async () => {
      const v = await yyl.run('yyl --version --silent');
      expect(v).not.equal(undefined);
    }));
  });
}

if (TEST_CTRL.HELP) {
  describe('yyl -h test', () => {
    it('yyl -h', fn.makeAsync(async () => {
      const h = await yyl.run('yyl -h --silent');
      expect(h).not.equal(undefined);
    }));
    it('yyl --help', fn.makeAsync(async () => {
      const h = await yyl.run('yyl --help --silent');
      expect(h).not.equal(undefined);
    }));
  });
}

if (TEST_CTRL.PATH) {
  describe('yyl -p test', () => {
    it('yyl -p', fn.makeAsync(async () => {
      const p = await yyl.run('yyl -p --silent');
      expect(p).to.equal(util.vars.BASE_PATH);
    }));

    it('yyl --path', fn.makeAsync(async () => {
      const p = await yyl.run('yyl -p --silent');
      expect(p).to.equal(util.vars.BASE_PATH);
    }));
  });
}

if (TEST_CTRL.INFO) {
  describe('yyl info test', () => {
    it('yyl info', fn.makeAsync(async () => {
      const workflowPath = util.path.join(__dirname, './workflow-test/gulp-requirejs');
      const info = await yyl.run('yyl info --silent', workflowPath);
      expect(info.workflow).to.equal('gulp-requirejs');
    }));
  });
}

if (TEST_CTRL.MOCK) {
  describe('yyl mock test', () => {
    const mockPath = path.join(__dirname, './workflow-test/gulp-requirejs');
    const get = function (iPath, isJson) {
      const runner = function(next) {
        http.get(iPath, (res) => {
          let rawData = '';
          res.on('data', (chunk) => {
            rawData += chunk;
          });
          res.on('end', () => {
            let data = rawData;
            if (isJson) {
              data = JSON.parse(rawData);
            }
            next([res, data]);
          });
        });
      };
      return new Promise(runner);
    };

    it('mock server start', fn.makeAsync(async () => {
      await yyl.run('server start --silent --logLevel 0', mockPath);
    }));

    it('/db', fn.makeAsync(async () => {
      const testPath = 'http://127.0.0.1:5000/db';
      const argv = await get(testPath, true);
      const [res, data] = argv;
      expect(res.statusCode).equal(200);
      expect(typeof data).equal('object');
    }));

    it('/mockapi', fn.makeAsync(async () => {
      const testPath = 'http://127.0.0.1:5000/mockapi';
      const argv = await get(testPath, true);
      const [res, data] = argv;
      expect(res.statusCode).equal(200);
      expect(data.length).not.equal(0);
    }));

    it('/mockapi/1', fn.makeAsync(async () => {
      const testPath = 'http://127.0.0.1:5000/mockapi/1';
      const argv = await get(testPath, true);
      const [res, data] = argv;
      expect(res.statusCode).equal(200);
      expect(typeof data).equal('object');
    }));

    it('/mockapi?_sort=id', fn.makeAsync(async () => {
      const testPath = 'http://127.0.0.1:5000/mockapi?_sort=id';
      const argv = await get(testPath, true);
      const [res, data] = argv;
      expect(res.statusCode).equal(200);
      expect(data[0].id).equal(1);
    }));

    it('/mockapi?_sort=id&_order=desc', fn.makeAsync(async () => {
      const testPath = 'http://127.0.0.1:5000/mockapi?_sort=id&_order=desc';
      const argv = await get(testPath, true);
      const [res, data] = argv;
      expect(res.statusCode).equal(200);
      expect(data[0].id).equal(5);
    }));

    it('/mockapi?_start=1', fn.makeAsync(async () => {
      const testPath = 'http://127.0.0.1:5000/mockapi?_start=1';
      const argv = await get(testPath, true);
      const [res, data] = argv;
      expect(res.statusCode).equal(200);
      expect(data.length).equal(4);
    }));

    it('/mockapi?_end=3', fn.makeAsync(async () => {
      const testPath = 'http://127.0.0.1:5000/mockapi?_end=3';
      const argv = await get(testPath, true);
      const [res, data] = argv;
      expect(res.statusCode).equal(200);
      expect(data.length).equal(4);
    }));

    it('/mockapi?_limit=3', fn.makeAsync(async () => {
      const testPath = 'http://127.0.0.1:5000/mockapi?_limit=3';
      const argv = await get(testPath, true);
      const [res, data] = argv;
      expect(res.statusCode).equal(200);
      expect(data.length).equal(3);
    }));

    it('/mockapi?_limit=-1', fn.makeAsync(async () => {
      const testPath = 'http://127.0.0.1:5000/mockapi?_limit=-1';
      const argv = await get(testPath, true);
      const [res, data] = argv;
      expect(res.statusCode).equal(200);
      expect(data.length).equal(0);
    }));

    it('/mockapi?_start=1&_end=3', fn.makeAsync(async () => {
      const testPath = 'http://127.0.0.1:5000/mockapi?_start=1&_end=3';
      const argv = await get(testPath, true);
      const [res, data] = argv;
      expect(res.statusCode).equal(200);
      expect(data.length).equal(3);
    }));

    it('/mockapi?_start=1&_end=3&_limit=2', fn.makeAsync(async () => {
      const testPath = 'http://127.0.0.1:5000/mockapi?_start=1&_end=3&_limit=2';
      const argv = await get(testPath, true);
      const [res, data] = argv;
      expect(res.statusCode).equal(200);
      expect(data.length).equal(2);
    }));

    it('/mockapi?id_gte=2', fn.makeAsync(async () => {
      const testPath = 'http://127.0.0.1:5000/mockapi?id_gte=2';
      const argv = await get(testPath, true);
      const [res, data] = argv;
      expect(res.statusCode).equal(200);
      expect(data.length).equal(4);
    }));

    it('/mockapi?id_lte=2', fn.makeAsync(async () => {
      const testPath = 'http://127.0.0.1:5000/mockapi?id_lte=2';
      const argv = await get(testPath, true);
      const [res, data] = argv;
      expect(res.statusCode).equal(200);
      expect(data.length).equal(2);
    }));

    it('/mockapi?id_ne=2', fn.makeAsync(async () => {
      const testPath = 'http://127.0.0.1:5000/mockapi?id_ne=2';
      const argv = await get(testPath, true);
      const [res, data] = argv;
      expect(res.statusCode).equal(200);
      expect(data.length).equal(4);
    }));

    it('/mockapi?title_like=又', fn.makeAsync(async () => {
      const testPath = `http://127.0.0.1:5000/mockapi?title_like=${encodeURIComponent('又')}`;
      const argv = await get(testPath, true);
      const [res, data] = argv;
      expect(res.statusCode).equal(200);
      expect(data.length).equal(1);
    }));

    it('/mockapi?uid=1369446333', fn.makeAsync(async () => {
      const testPath = 'http://127.0.0.1:5000/mockapi?uid=1369446333';
      const argv = await get(testPath, true);
      const [res, data] = argv;
      expect(res.statusCode).equal(200);
      expect(data.length).equal(1);
    }));


    it('/justObject', fn.makeAsync(async () => {
      const testPath = 'http://127.0.0.1:5000/justObject';
      const argv = await get(testPath, true);
      const [res, data] = argv;
      expect(res.statusCode).equal(200);
      expect(typeof data).equal('object');
    }));

    it('routes test /api/1', fn.makeAsync(async () => {
      const testPath = 'http://127.0.0.1:5000/api/1';
      const argv = await get(testPath, true);
      const [res, data] = argv;
      expect(res.statusCode).equal(200);
      expect(typeof data).equal('object');
    }));

    it('routes test /api', fn.makeAsync(async () => {
      const testPath = 'http://127.0.0.1:5000/api';
      const argv = await get(testPath, true);
      const [res, data] = argv;
      expect(res.statusCode).equal(200);
      expect(data.length).not.equal(0);
    }));

    it('routes test /mapi/1', fn.makeAsync(async () => {
      const testPath = 'http://127.0.0.1:5000/mapi/1';
      const argv = await get(testPath, true);
      const [res, data] = argv;
      expect(res.statusCode).equal(200);
      expect(typeof data).equal('object');
    }));


    const jsonpMatch = /^aa\((.+)\);$/;
    it('jsonp test /mapi/1?callback=aa', fn.makeAsync(async () => {
      const testPath = 'http://127.0.0.1:5000/mapi/1?callback=aa';
      const argv = await get(testPath);
      const [res, data] = argv;
      expect(res.statusCode).equal(200);
      const iMatch = data.match(jsonpMatch);
      expect(iMatch).not.equal(null);
      expect(typeof JSON.parse(iMatch[1])).equal('object');
    }));

    it('jsonp test /mapi?jsonp=bb&bb=aa', fn.makeAsync(async () => {
      const testPath = 'http://127.0.0.1:5000/mapi?jsonp=bb&bb=aa';
      const argv = await get(testPath);
      const [res, data] = argv;
      expect(res.statusCode).equal(200);
      const iMatch = data.match(jsonpMatch);
      expect(iMatch).not.equal(null);
      expect(typeof JSON.parse(iMatch[1])).equal('object');
    }));

    it('mock server abort', fn.makeAsync(async () => {
      await yyl.run('server abort');
    }));
  });
}

if (TEST_CTRL.INIT) {
  describe('yyl init test', () => {
    // single cmd
    const cmds = [];
    const buildCmd = (op) => {
      if (op.platform === 'both') {
        return [
          'init --silent',
          `--name ${op.name}`,
          `--platform ${op.platform}`,
          `--pcWorkflow ${op.pc.workflow}`,
          `--pcInit ${op.pc.example}`,
          `--mobileWorkflow ${op.mobile.workflow}`,
          `--mobileInit ${op.mobile.example}`,
          `--commitType ${op.commitType}`
        ].join(' ');
      } else {
        return [
          'init --silent',
          `--name ${op.name}`,
          `--workflow ${op.workflow}`,
          `--platform ${op.platform}`,
          `--init ${op.example}`,
          `--commitType ${op.commitType}`
        ].join(' ');
      }
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

    // multi cmd
    SEED.workflows.forEach((pcWorkflow) => {
      const pcSeed = SEED.find(pcWorkflow);
      pcSeed.examples.forEach((pcExample) => {
        SEED.workflows.forEach((mobileWorkflow) => {
          const mobileSeed = SEED.find(mobileWorkflow);
          mobileSeed.examples.forEach((mobileExample) => {
            wInit.ENV.COMMIT_TYPES.forEach((commitType) => {
              cmds.push(buildCmd({
                name: cmds.length,
                platform: 'both',
                commitType: commitType,
                pc: {
                  example: pcExample,
                  workflow: pcWorkflow
                },
                mobile: {
                  example: mobileExample,
                  workflow: mobileWorkflow
                }
              }));
            });
          });
        });
      });
    });

    const YYL_PKG_PATH = path.join(util.vars.BASE_PATH, 'package.json');
    const pkgConfig = require(YYL_PKG_PATH);

    async function dirCheck (pjPath, iEnv) {
      // 检查 config 各项属性是否正确
      const configPath = path.join(pjPath, 'config.js');
      expect(fs.existsSync(configPath)).to.equal(true);

      const config = util.requireJs(configPath);

      expect(typeof config).to.equal('object');
      if (iEnv.platform === 'both') {
        expect(typeof config.pc).to.equal('object');
        expect(config.pc.version).to.equal(pkgConfig.version);
        expect(config.pc.workflow).to.equal(iEnv.pcWorkflow);
        expect(config.pc.name).to.equal(`${iEnv.name}`);
        expect(config.pc.platform).to.equal('pc');

        expect(typeof config.mobile).to.equal('object');
        expect(config.mobile.version).to.equal(pkgConfig.version);
        expect(config.mobile.workflow).to.equal(iEnv.mobileWorkflow);
        expect(config.mobile.name).to.equal(`${iEnv.name}`);
        expect(config.mobile.platform).to.equal('mobile');
      } else {
        expect(config.version).to.equal(pkgConfig.version);
        expect(config.workflow).to.equal(iEnv.workflow);
        expect(`${config.name}`).to.equal(`${iEnv.name}`);
        expect(config.platform).to.equal(iEnv.platform);
      }

      // 需要 存在的 地址列表
      let existsList = [
        'README.md'
      ];

      // 需要 忽略的 地址列表
      let ignoreList = [
        'config.extend.js',
        'README.extend.md'
      ];

      // 需要检查 替换是否正确的 列表
      let replaceList = [
        'README.md',
        'config.js'
      ];

      // 拷贝的完整性校验
      const readFilter = /\.DS_Store$/;
      const checkingPaths = [
        // commons path
        path.join(util.vars.BASE_PATH, 'init/commons'),
        // commit-type path
        path.join(util.vars.BASE_PATH, 'init', `commit-type-${iEnv.commitType}`)
      ];

      if (iEnv.platform === 'both') {
        existsList = existsList.concat([
          'config.pc.js',
          'config.mobile.js'
        ]);

        replaceList = replaceList.concat([
          'config.pc.js',
          'config.mobile.js'
        ]);

        checkingPaths.push(
          path.join(util.vars.BASE_PATH, 'init', 'platform-both')
        );
      }

      for (let i = 0, len = checkingPaths.length; i < len; i++) {
        let checkingPath = checkingPaths[i];
        const rPaths = await extFs.readFilePaths(checkingPath, readFilter);
        rPaths.forEach((rPath) => {
          const relativePath = util.path.relative(checkingPath, rPath);
          if (ignoreList.indexOf(relativePath) === -1 && existsList.indexOf(existsList) === -1) {
            existsList.push(relativePath);
          }
        });
      }

      existsList.forEach((rPath) => {
        const iPath = path.join(pjPath, rPath);
        expect(fs.existsSync(iPath)).to.equal(true);
      });

      ignoreList.forEach((rPath) => {
        const iPath = path.join(pjPath, rPath);
        expect(fs.existsSync(iPath)).to.equal(false);
      });

      // 替换类文件正确性校验
      replaceList.forEach((rPath) => {
        const iPath = path.join(pjPath, rPath);
        const cnt = fs.readFileSync(iPath).toString();
        expect(cnt.split('undefined').length).to.equal(1);
        expect(cnt.split('null').length).to.equal(1);
      });

      // TODO 跑一下看是否有东西生成
      const dest = {
        async clear() {
          await extFs.removeFiles(path.join(pjPath, 'dist'));
        },
        async check() {
          const destFiles = await extFs.readFilePaths(path.join(pjPath, 'dist'));
          expect(destFiles.length).not.equal(0);
        }
      };
      if (iEnv.platform === 'both') {
        await dest.clear();
        await yyl.run('all --name pc --silent', pjPath);
        await dest.check();

        await dest.clear();
        await yyl.run('all --name mobile --silent', pjPath);
        await dest.check();
      } else {
        await dest.clear();
        await yyl.run('all --silent', pjPath);
        await dest.check();
      }
    }


    cmds.forEach((cmd, index) => {
      it(cmd, fn.makeAsync(async () => {
        const initPath = path.join(FRAG_PATH, `${index}`);
        extFs.mkdirSync(initPath);
        await fn.frag.build();

        extFs.mkdirSync(initPath);

        await yyl.run(cmd, initPath);
        await dirCheck(initPath, util.envParse(cmd));

        await fn.frag.destroy();
      }));
    });
  });
}

if (TEST_CTRL.ALL) {
  describe('yyl all test', () => {
    it('test prepare', fn.makeAsync(async () => {
      // frag init
      await fn.frag.build();

      // copy files
      const copyParam = {};
      copyParam[path.join(__dirname, './workflow-test/commons')] = [
        path.join(FRAG_PATH, 'commons')
      ];
      copyParam[path.join(__dirname, './workflow-test/gulp-requirejs')] = [
        path.join(FRAG_PATH, 'gulp-requirejs')
      ];
      await extFs.copyFiles(copyParam);
    }));

    async function destCheck (projectPath, selfConfigPath) {
      let configPath = path.join(projectPath, 'config.js');
      if (selfConfigPath) {
        configPath = selfConfigPath;
      }

      // check
      const config = await extFn.parseConfig(configPath, {});
      const { destRoot } = config.alias;
      const htmlList = await extFs.readFilePaths(destRoot, /\.html$/, true);
      const cssList = await extFs.readFilePaths(destRoot, /\.css$/, true);
      const jsList = await extFs.readFilePaths(destRoot, /\.js$/, true);

      const bothHostArr = [];
      if (config.commit.mainHost) {
        bothHostArr.push(config.commit.mainHost);
      }
      if (config.commit.staticHost) {
        bothHostArr.push(config.commit.staticHost);
      }
      if (config.commit.hostname) {
        bothHostArr.push(config.commit.hostname);
      }
      const BOTH_SOURCE_REG = new RegExp(`^(${bothHostArr.join('|')})`);

      const remoteSource = [];
      const localSource = [];
      const bothMap = {};
      const sourcePickup = (iPath, dirname) => {
        const rPath = fn.hideUrlTail(iPath);
        if (rPath.match(frp.REG.HTML_IGNORE_REG)) { // 可忽略 的 url
          return;
        } else if (rPath.match(frp.REG.IS_HTTP)) { // http
          remoteSource.push(rPath);
          if (rPath.match(BOTH_SOURCE_REG)) {
            bothMap[rPath] = path.join(destRoot, rPath.replace(BOTH_SOURCE_REG, ''));
          }
        } else if (rPath.match(frp.REG.HTML_IS_ABSLUTE)) { // 绝对地址 /
          localSource.push(path.join(destRoot, rPath));
        } else { // 相对地址
          localSource.push(path.join(dirname, rPath));
        }
      };

      htmlList.forEach((iPath) => {
        const ctx = fs.readFileSync(iPath).toString();
        frp.htmlPathMatch(ctx, (rPath) => {
          sourcePickup(rPath, path.dirname(iPath));
          return rPath;
        });
      });
      cssList.forEach((iPath) => {
        const ctx = fs.readFileSync(iPath).toString();
        frp.cssPathMatch(ctx, (rPath) => {
          sourcePickup(rPath, path.dirname(iPath));
          return rPath;
        });
      });
      jsList.forEach((iPath) => {
        const ctx = fs.readFileSync(iPath).toString();
        frp.jsPathMatch(ctx, (rPath) => {
          sourcePickup(rPath, path.dirname(iPath));
          return rPath;
        });
      });

      const revPath = path.join(config.alias.revDest, 'rev-manifest.json');
      const hashMap = util.requireJs(revPath);

      // check hash map exist
      Object.keys(hashMap).forEach((key) => {
        if (key == 'version') {
          return;
        }
        const url1 = util.path.join(config.alias.revRoot, key);
        const url2 = util.path.join(config.alias.revRoot, hashMap[key]);

        expect(fs.existsSync(url1)).to.equal(true);
        expect(fs.existsSync(url2)).to.equal(true);
      });

      localSource.forEach((iPath) => {
        expect(fs.existsSync(iPath)).to.equal(true);
      });

      await (() => {
        const NO_PROTOCOL = /^\/\/(\w)/;
        return new Promise((next) => {
          const promiseArr = [];
          remoteSource.forEach((iPath) => {
            var rPath = iPath;
            if (rPath.match(NO_PROTOCOL)) {
              rPath = rPath.replace(NO_PROTOCOL, 'http://$1');
            }

            promiseArr.push(fn.get(rPath));
          });
          Promise.all(promiseArr).then((values) => {
            values.forEach((res, i) => {
              const remoteUrl = remoteSource[i];
              if (res.statusCode !== 200 && bothMap[remoteUrl]) {
                expect(fs.existsSync(bothMap[remoteUrl])).to.equal(true);
              } else {
                expect(res.statusCode).to.equal(200);
              }
            });
            next();
          });
        });
      })();
    }

    const FRAG_WORKFLOW_PATH = path.join(FRAG_PATH, 'gulp-requirejs');
    const ABSOLUTE_CONFIG_PATH = util.path.join(FRAG_WORKFLOW_PATH, 'config.test.js');
    const RELATIVE_CONFIG_PATH = 'config.test.js';

    it('yyl all', fn.makeAsync(async () => {
      const distPath = path.join(FRAG_WORKFLOW_PATH, 'dist');

      // clear dist
      await extFs.removeFiles(distPath);

      // run all
      await yyl.run('all --logLevel 0', FRAG_WORKFLOW_PATH);

      await destCheck(FRAG_WORKFLOW_PATH);
    }));

    it('yyl all --isCommit', fn.makeAsync(async () => {
      const distPath = path.join(FRAG_WORKFLOW_PATH, 'dist');

      // clear dist
      await extFs.removeFiles(distPath);

      // run all
      await yyl.run('all --isCommit --logLevel 0', FRAG_WORKFLOW_PATH);

      await destCheck(FRAG_WORKFLOW_PATH);
    }));



    it(`yyl all --config ${ABSOLUTE_CONFIG_PATH}`, fn.makeAsync(async () => {
      const distPath = path.join(FRAG_WORKFLOW_PATH, 'dist');

      // clear dist
      await extFs.removeFiles(distPath);

      // run all
      await yyl.run(`all --config ${ABSOLUTE_CONFIG_PATH} --logLevel 0`, FRAG_WORKFLOW_PATH);

      await destCheck(FRAG_WORKFLOW_PATH, ABSOLUTE_CONFIG_PATH);
    }));

    it(`yyl all --config ${RELATIVE_CONFIG_PATH}`, fn.makeAsync(async () => {
      const distPath = path.join(FRAG_WORKFLOW_PATH, 'dist');

      // clear dist
      await extFs.removeFiles(distPath);

      // run all
      await yyl.run(`all --config ${RELATIVE_CONFIG_PATH} --logLevel 0`, FRAG_WORKFLOW_PATH);

      await destCheck(FRAG_WORKFLOW_PATH, ABSOLUTE_CONFIG_PATH);
    }));
  });
}

if (TEST_CTRL.COMMIT) {
  describe('yyl commit test', () => {
    const workflows = ['gulp-requirejs'];
    workflows.forEach((workflow) => {
      it(`yyl commit for ${workflow}`, fn.makeAsync(async () => {
        const WORKFLOW_PATH = path.join(__dirname, 'workflow-test', workflow);
        const COMMON_PATH = path.join(__dirname, 'workflow-test/commons');
        const FRAG_WORKFLOW_PATH = util.path.join(FRAG_PATH, 'workflow');
        const FRAG_COMMONS_PATH = util.path.join(FRAG_PATH, 'commons');

        await fn.frag.build();
        util.mkdirSync(FRAG_WORKFLOW_PATH);
        util.mkdirSync(FRAG_COMMONS_PATH);
        const obj = {};
        obj[WORKFLOW_PATH] = FRAG_WORKFLOW_PATH;
        obj[COMMON_PATH] = FRAG_COMMONS_PATH;

        await extFs.copyFiles(obj);

        const svnPath = 'https://svn.yy.com/yy-music/static/project/workflow_demo';
        const svnDir = util.path.join(FRAG_WORKFLOW_PATH, '../__committest');
        util.mkdirSync(svnDir);

        extFn.makeAwait((next) => {
          util.runCMD(`svn checkout ${svnPath}`, (err) => {
            if (err) {
              throw new Error(err);
            }
            next();
          }, svnDir);
        });

        await yyl.run('commit --sub dev --silent --logLevel 0', FRAG_WORKFLOW_PATH);
        expect(true).equal(true);
        fn.frag.destroy();
      }));
    });
  });
}
