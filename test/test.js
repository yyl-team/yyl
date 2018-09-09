const extFs = require('yyl-fs');
const path = require('path');
const fs = require('fs');
const chai = require('chai');
const expect = chai.expect;
const http = require('http');

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

const TEST_CTRL = {
  SERVER: true,
  VERSION: true,
  HELP: true,
  PATH: true,
  MOCK: true,
  INIT: true,
  ALL: true,
  WATCH: true,
  COMMIT: true
};

if (TEST_CTRL.SERVER) {
  describe('yyl server test', () => {
    it('yyl server -h', (done) => {
      yyl.run('server -h --silent', __dirname).then((h) => {
        expect(h).not.equal(undefined);
        done();
      });
    });
    it('yyl server --help', (done) => {
      yyl.run('server --help --silent', __dirname).then((h) => {
        expect(h).not.equal(undefined);
        done();
      });
    });
    it('yyl server start', function(done) {
      this.timeout(0);

      yyl.run('server start --logLevel 0 --silent', __dirname).then((setting) => {
        expect(setting.server).not.equal(false);
        const testPath = `http://${util.vars.LOCAL_SERVER}:${setting.server.port}/test.js`;
        http.get(testPath, (res) => {
          expect(res.statusCode).equal(200);
          yyl.run('server abort').then(() => {
            done();
          });
        });
      }).catch((er) => {
        throw new Error(er);
      });
    });

    it(`yyl server start --path ${__dirname}`, (done) => {
      yyl.run(`server start --logLevel 0 --silent --path ${__dirname}`).then((setting) => {
        expect(setting.server).not.equal(false);
        const testPath = `http://${util.vars.LOCAL_SERVER}:${setting.server.port}/test.js`;
        http.get(testPath, (res) => {
          expect(res.statusCode).equal(200);
          yyl.run('server abort').then(() => {
            done();
          });
        });
      }).catch((er) => {
        throw new Error(er);
      });
    });

    it('yyl server start --path ./', (done) => {
      yyl.run('server start --logLevel 0 --silent --path ./', __dirname).then((setting) => {
        expect(setting.server).not.equal(false);
        const testPath = `http://${util.vars.LOCAL_SERVER}:${setting.server.port}/test.js`;
        http.get(testPath, (res) => {
          expect(res.statusCode).equal(200);
          yyl.run('server abort').then(() => {
            done();
          });
        });
      }).catch((er) => {
        throw new Error(er);
      });
    });
    it('yyl server -p', (done) => {
      yyl.run('server -p --silent', __dirname).then((iPath) => {
        expect(iPath).to.equal(util.vars.SERVER_PATH);
        done();
      });
    });
    it('yyl server --path', (done) => {
      yyl.run('server --path --silent', __dirname).then((iPath) => {
        expect(iPath).to.equal(util.vars.SERVER_PATH);
        done();
      });
    });
  });
}

if (TEST_CTRL.VERSION) {
  describe('yyl -v test', () => {
    it('yyl -v', (done) => {
      yyl.run('yyl -v --silent').then((v) => {
        expect(v).not.equal(undefined);
        done();
      }).catch((er) => {
        throw new Error(er);
      });
    });
    it('yyl --version', (done) => {
      yyl.run('yyl --version --silent').then((v) => {
        expect(v).not.equal(undefined);
        done();
      }).catch((er) => {
        throw new Error(er);
      });
    });
  });
}

if (TEST_CTRL.HELP) {
  describe('yyl -h test', () => {
    it('yyl -h', (done) => {
      yyl.run('yyl -h --silent').then((h) => {
        expect(h).not.equal(undefined);
        done();
      }).catch((er) => {
        throw new Error(er);
      });
    });
    it('yyl --help', (done) => {
      yyl.run('yyl --help --silent').then((h) => {
        expect(h).not.equal(undefined);
        done();
      }).catch((er) => {
        throw new Error(er);
      });
    });
  });
}

if (TEST_CTRL.PATH) {
  describe('yyl -p test', () => {
    it('yyl -p', (done) => {
      yyl.run('yyl -p --silent').then((p) => {
        expect(p).to.equal(util.vars.BASE_PATH);
        done();
      }).catch((er) => {
        throw new Error(er);
      });
    });

    it('yyl --path', (done) => {
      yyl.run('yyl -p --silent').then((p) => {
        expect(p).to.equal(util.vars.BASE_PATH);
        done();
      }).catch((er) => {
        throw new Error(er);
      });
    });
  });
}

if (TEST_CTRL.INFO) {
  describe('yyl info test', () => {
    it('yyl info', (done) => {
      const workflowPath = util.path.join(__dirname, './workflow-test/gulp-requirejs');
      yyl.run('yyl info --silent', workflowPath).then((info) => {
        expect(info.workflow).to.equal('gulp-requirejs');
        done();
      }).catch((er) => {
        throw new Error(er);
      });
    });
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

    it('mock server start', function(done) {
      this.timeout(0);
      yyl.run('server start --silent --logLevel 0', mockPath).then(() => {
        done();
      }).catch((er) => {
        throw new Error(er);
      });
    });

    it('/db', function(done) {
      this.timeout(0);
      const testPath = 'http://127.0.0.1:5000/db';
      get(testPath, true).then((argv) => {
        const [res, data] = argv;
        expect(res.statusCode).equal(200);
        expect(typeof data).equal('object');
        done();
      });
    });

    it('/mockapi', function(done) {
      this.timeout(0);
      const testPath = 'http://127.0.0.1:5000/mockapi';
      get(testPath, true).then((argv) => {
        const [res, data] = argv;
        expect(res.statusCode).equal(200);
        expect(data.length).not.equal(0);
        done();
      });
    });

    it('/mockapi/1', function(done) {
      this.timeout(0);
      const testPath = 'http://127.0.0.1:5000/mockapi/1';
      get(testPath, true).then((argv) => {
        const [res, data] = argv;
        expect(res.statusCode).equal(200);
        expect(typeof data).equal('object');
        done();
      });
    });

    it('/mockapi?_sort=id', function(done) {
      this.timeout(0);
      const testPath = 'http://127.0.0.1:5000/mockapi?_sort=id';
      get(testPath, true).then((argv) => {
        const [res, data] = argv;
        expect(res.statusCode).equal(200);
        expect(data[0].id).equal(1);
        done();
      });
    });

    it('/mockapi?_sort=id&_order=desc', function(done) {
      this.timeout(0);
      const testPath = 'http://127.0.0.1:5000/mockapi?_sort=id&_order=desc';
      get(testPath, true).then((argv) => {
        const [res, data] = argv;
        expect(res.statusCode).equal(200);
        expect(data[0].id).equal(5);
        done();
      });
    });

    it('/mockapi?_start=1', function(done) {
      this.timeout(0);
      const testPath = 'http://127.0.0.1:5000/mockapi?_start=1';
      get(testPath, true).then((argv) => {
        const [res, data] = argv;
        expect(res.statusCode).equal(200);
        expect(data.length).equal(4);
        done();
      });
    });

    it('/mockapi?_end=3', function(done) {
      this.timeout(0);
      const testPath = 'http://127.0.0.1:5000/mockapi?_end=3';
      get(testPath, true).then((argv) => {
        const [res, data] = argv;
        expect(res.statusCode).equal(200);
        expect(data.length).equal(4);
        done();
      });
    });

    it('/mockapi?_limit=3', function(done) {
      this.timeout(0);
      const testPath = 'http://127.0.0.1:5000/mockapi?_limit=3';
      get(testPath, true).then((argv) => {
        const [res, data] = argv;
        expect(res.statusCode).equal(200);
        expect(data.length).equal(3);
        done();
      });
    });

    it('/mockapi?_limit=-1', function(done) {
      this.timeout(0);
      const testPath = 'http://127.0.0.1:5000/mockapi?_limit=-1';
      get(testPath, true).then((argv) => {
        const [res, data] = argv;
        expect(res.statusCode).equal(200);
        expect(data.length).equal(0);
        done();
      });
    });

    it('/mockapi?_start=1&_end=3', function(done) {
      this.timeout(0);
      const testPath = 'http://127.0.0.1:5000/mockapi?_start=1&_end=3';
      get(testPath, true).then((argv) => {
        const [res, data] = argv;
        expect(res.statusCode).equal(200);
        expect(data.length).equal(3);
        done();
      });
    });

    it('/mockapi?_start=1&_end=3&_limit=2', function(done) {
      this.timeout(0);
      const testPath = 'http://127.0.0.1:5000/mockapi?_start=1&_end=3&_limit=2';
      get(testPath, true).then((argv) => {
        const [res, data] = argv;
        expect(res.statusCode).equal(200);
        expect(data.length).equal(2);
        done();
      });
    });

    it('/mockapi?id_gte=2', function(done) {
      this.timeout(0);
      const testPath = 'http://127.0.0.1:5000/mockapi?id_gte=2';
      get(testPath, true).then((argv) => {
        const [res, data] = argv;
        expect(res.statusCode).equal(200);
        expect(data.length).equal(4);
        done();
      });
    });

    it('/mockapi?id_lte=2', function(done) {
      this.timeout(0);
      const testPath = 'http://127.0.0.1:5000/mockapi?id_lte=2';
      get(testPath, true).then((argv) => {
        const [res, data] = argv;
        expect(res.statusCode).equal(200);
        expect(data.length).equal(2);
        done();
      });
    });

    it('/mockapi?id_ne=2', function(done) {
      this.timeout(0);
      const testPath = 'http://127.0.0.1:5000/mockapi?id_ne=2';
      get(testPath, true).then((argv) => {
        const [res, data] = argv;
        expect(res.statusCode).equal(200);
        expect(data.length).equal(4);
        done();
      });
    });

    it('/mockapi?title_like=又', function(done) {
      this.timeout(0);
      const testPath = `http://127.0.0.1:5000/mockapi?title_like=${encodeURIComponent('又')}`;
      get(testPath, true).then((argv) => {
        const [res, data] = argv;
        expect(res.statusCode).equal(200);
        expect(data.length).equal(1);
        done();
      });
    });

    it('/mockapi?uid=1369446333', function(done) {
      this.timeout(0);
      const testPath = 'http://127.0.0.1:5000/mockapi?uid=1369446333';
      get(testPath, true).then((argv) => {
        const [res, data] = argv;
        expect(res.statusCode).equal(200);
        expect(data.length).equal(1);
        done();
      });
    });


    it('/justObject', function(done) {
      this.timeout(0);
      const testPath = 'http://127.0.0.1:5000/justObject';
      get(testPath, true).then((argv) => {
        const [res, data] = argv;
        expect(res.statusCode).equal(200);
        expect(typeof data).equal('object');
        done();
      });
    });

    it('routes test /api/1', function(done) {
      this.timeout(0);
      const testPath = 'http://127.0.0.1:5000/api/1';
      get(testPath, true).then((argv) => {
        const [res, data] = argv;
        expect(res.statusCode).equal(200);
        expect(typeof data).equal('object');
        done();
      });
    });

    it('routes test /api', function(done) {
      this.timeout(0);
      const testPath = 'http://127.0.0.1:5000/api';
      get(testPath, true).then((argv) => {
        const [res, data] = argv;
        expect(res.statusCode).equal(200);
        expect(data.length).not.equal(0);
        done();
      });
    });

    it('routes test /mapi/1', function(done) {
      this.timeout(0);
      const testPath = 'http://127.0.0.1:5000/mapi/1';
      get(testPath, true).then((argv) => {
        const [res, data] = argv;
        expect(res.statusCode).equal(200);
        expect(typeof data).equal('object');
        done();
      });
    });


    const jsonpMatch = /^aa\((.+)\);$/;
    it('jsonp test /mapi/1?callback=aa', function(done) {
      this.timeout(0);
      const testPath = 'http://127.0.0.1:5000/mapi/1?callback=aa';
      get(testPath).then((argv) => {
        const [res, data] = argv;
        expect(res.statusCode).equal(200);
        const iMatch = data.match(jsonpMatch);
        expect(iMatch).not.equal(null);
        expect(typeof JSON.parse(iMatch[1])).equal('object');
        done();
      });
    });
    it('jsonp test /mapi?jsonp=bb&bb=aa', function(done) {
      this.timeout(0);
      const testPath = 'http://127.0.0.1:5000/mapi?jsonp=bb&bb=aa';
      get(testPath).then((argv) => {
        const [res, data] = argv;
        expect(res.statusCode).equal(200);
        const iMatch = data.match(jsonpMatch);
        expect(iMatch).not.equal(null);
        expect(typeof JSON.parse(iMatch[1])).equal('object');
        done();
      });
    });

    it('mock server abort', function(done) {
      this.timeout(0);
      yyl.run('server abort').then(() => {
        done();
      }).catch((er) => {
        throw new Error(er);
      });
    });
  });
}

if (TEST_CTRL.INIT) {
  describe('yyl init test', () => {
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
}

if (TEST_CTRL.COMMIT) {
  describe('yyl commit test', () => {
    const workflows = ['gulp-requirejs'];
    workflows.forEach((workflow) => {
      it(`yyl commit for ${workflow}`, function(done) {
        this.timeout(0);
        const WORKFLOW_PATH = path.join(__dirname, 'workflow-test', workflow);
        const COMMON_PATH = path.join(__dirname, 'workflow-test/commons');
        const FRAG_WORKFLOW_PATH = util.path.join(FRAG_PATH, 'workflow');
        const FRAG_COMMONS_PATH = util.path.join(FRAG_PATH, 'commons');
        new util.Promise((next) => {
          fn.frag.destroy();
          fn.frag.build();
          util.mkdirSync(FRAG_WORKFLOW_PATH);
          util.mkdirSync(FRAG_COMMONS_PATH);
          const obj = {};
          obj[WORKFLOW_PATH] = FRAG_WORKFLOW_PATH;
          obj[COMMON_PATH] = FRAG_COMMONS_PATH;
          util.copyFiles(obj, () => {
            setTimeout(() => {
              next();
            }, 100);
          });
        }).then((next) => { // svn init
          const svnPath = 'https://svn.yy.com/yy-music/static/project/workflow_demo';
          const svnDir = util.path.join(FRAG_WORKFLOW_PATH, '../__committest');
          util.mkdirSync(svnDir);
          util.runCMD(`svn checkout ${svnPath}`, (err) => {
            if (err) {
              throw new Error(err);
            }
            next();
          }, svnDir);
        }).then((next) => {
          yyl.run('commit --sub dev --silent --logLevel 0', FRAG_WORKFLOW_PATH).then(() => {
            expect(true).equal(true);
            next();
          }).catch((er) => {
            throw new Error(er);
          });
        }).then(() => {
          fn.frag.destroy().then(() => {
            done();
          });
        }).start();
      });
    });
  });
}
