'use strict';
// WebdriverIO
const expect = require('chai').expect;
const path = require('path');
const fs = require('fs');
const util = require('../tasks/w-util.js');
const querystring = require('querystring');
const http = require('http');
// const webdriverio = require('webdriverio');

const yyl = require('../index.js');
const FRAG_PATH = path.join(__dirname, '__frag');
const FRAG_PATH2 = path.join(__dirname, '__frag2');

util.cleanScreen();

const TEST_CTRL = {
  SERVER: true,
  SERVER_INIT: true,
  // SERVER_CLEAR: true,
  // INIT: true,
  ALL: true,
  ALL_MAIN: true,
  ALL_IS_COMMIT: true,
  ALL_CONFIG: true,
  VERSION: true,
  HELP: true,
  PATH: true,
  INFO: true,
  EXAMPLE: true,
  MAKE: true,
  COMMIT: true
  // UPDATE: true
};

const fn = {
  hideUrlTail: function(url) {
    return url
      .replace(/\?.*?$/g, '')
      .replace(/#.*?$/g, '');
  },
  frag: {
    build: function() {
      return new Promise((next) => {
        if (fs.existsSync(FRAG_PATH)) {
          util.removeFiles(FRAG_PATH);
        } else {
          util.mkdirSync(FRAG_PATH);
        }

        if (fs.existsSync(FRAG_PATH2)) {
          util.removeFiles(FRAG_PATH2);
        } else {
          util.mkdirSync(FRAG_PATH2);
        }
        setTimeout(() => {
          next();
        }, 100);
      });
    },
    destroy: function() {
      return new Promise((next) => {
        if (fs.existsSync(FRAG_PATH)) {
          util.removeFiles(FRAG_PATH, true);
        }

        if (fs.existsSync(FRAG_PATH2)) {
          util.removeFiles(FRAG_PATH2, true);
        }
        setTimeout(() => {
          next();
        }, 100);
      });
    }
  }
};

fn.frag.destroy();
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

      yyl.run('server start --logLevel 0 --silent', __dirname).then((config) => {
        expect(config.server).not.equal(false);
        const testPath = `http://${util.vars.LOCAL_SERVER}:${config.localserver.port}/test.js`;
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
      yyl.run(`server start --logLevel 0 --silent --path ${__dirname}`).then((config) => {
        expect(config.server).not.equal(false);
        const testPath = `http://${util.vars.LOCAL_SERVER}:${config.localserver.port}/test.js`;
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
      yyl.run('server start --logLevel 0 --silent --path ./', __dirname).then((config) => {
        expect(config.server).not.equal(false);
        const testPath = `http://${util.vars.LOCAL_SERVER}:${config.localserver.port}/test.js`;
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

    if (TEST_CTRL.SERVER_CLEAR) {
      it('yyl server clear <workflow>', function(done) {
        this.timeout(0);
        yyl.run('server clear gulp-requirejs').then(() => {
          const initPath = util.path.join(util.vars.INIT_FILE_PATH, 'gulp-requirejs/node_modules');
          expect([
            initPath,
            !fs.existsSync(initPath) || fs.readdirSync(initPath).length == 0
          ]).to.deep.equal([
            initPath,
            true
          ]);
          done();
        }).catch((er) => {
          throw new Error(er);
        });
      });
      it('yyl server clear', function(done) {
        this.timeout(0);
        yyl.run('server clear').then(() => {
          const workflows = fs.readdirSync(util.vars.INIT_FILE_PATH);
          workflows.forEach((workflow) => {
            const initPath = util.path.join(util.vars.INIT_FILE_PATH, workflow, 'node_modules');
            expect([
              initPath,
              !fs.existsSync(initPath) || fs.readdirSync(initPath).length == 0
            ]).to.deep.equal([
              initPath,
              true
            ]);
          });
          done();
        }).catch((er) => {
          throw new Error(er);
        });
      });
    }

    if (TEST_CTRL.SERVER_INIT) {
      it('yyl server init <workflow>', function(done) {
        this.timeout(0);
        yyl.run('server init gulp-requirejs').then(() => {
          const initPath = util.path.join(util.vars.INIT_FILE_PATH, 'gulp-requirejs/node_modules');
          const workflowPath = util.path.join(util.vars.SERVER_WORKFLOW_PATH, 'gulp-requirejs');
          expect([
            initPath,
            fs.readdirSync(initPath).length > 0
          ]).to.deep.equal([
            initPath,
            true
          ]);
          expect([
            workflowPath,
            fs.existsSync(workflowPath)
          ]).to.deep.equal([
            workflowPath,
            true
          ]);
          done();
        }).catch((er) => {
          throw new Error(er);
        });
      });
      it('yyl server init', function(done) {
        this.timeout(0);
        yyl.run('server init').then(() => {
          expect([
            util.vars.SERVER_PATH,
            fs.existsSync(util.vars.SERVER_PATH)
          ]).to.deep.equal([
            util.vars.SERVER_PATH,
            true
          ]);
          const workflows = fs.readdirSync(util.vars.INIT_FILE_PATH);
          workflows.forEach((workflow) => {
            const initPath = util.path.join(util.vars.INIT_FILE_PATH, workflow, 'node_modules');
            const workflowPath = util.path.join(util.vars.SERVER_WORKFLOW_PATH, workflow);
            expect([
              initPath,
              fs.readdirSync(initPath).length > 0
            ]).to.deep.equal([
              initPath,
              true
            ]);
            expect([
              workflowPath,
              fs.existsSync(workflowPath)
            ]).to.deep.equal([
              workflowPath,
              true
            ]);
          });
          done();
        }).catch((er) => {
          throw new Error(er);
        });
      });
    }
  });
}


if (TEST_CTRL.INIT) {
  describe('yyl init test', () => {
    var iWorkflows = util.readdirSync(path.join(__dirname, '../init-files'), /^\./);
    var copyTask = function(workflow, init) {
      it(`yyl init copy test, ${workflow}:${init}`, function(done) {
        this.timeout(0); // 设置用例超时时间
        fn.frag.destroy();
        fn.frag.build();

        var sourcePath01 = path.join(__dirname, '../init-files', workflow);
        var sourcePath02 = path.join(__dirname, '../examples', workflow, init);
        var projectPath = FRAG_PATH;
        const cmd = `init ${util.envStringify({
          name: FRAG_PATH.split(/[/\\]+/).pop(),
          platform: 'pc',
          workflow: workflow,
          init: init,
          doc: 'git',
          silent: true
        })}`;

        yyl.run(cmd, FRAG_PATH).then(() => { // 文件校验
          var rFiles = util.readFilesSync(projectPath);
          var s01Files = util.readFilesSync(sourcePath01, (iPath) => {
            var relativePath = util.joinFormat(path.relative(sourcePath01, iPath));
            if (/readme\.md|\.gitignore|\.eslintrc\.js|\.editorconfig/i.test(iPath) && !/node_modules/.test(relativePath)) {
              return true;
            } else {
              return false;
            }
          });
          var s02Files = util.readFilesSync(
            sourcePath02,
            (iPath) => {
              if (/package\.json|gulple\.js|\.DS_Store|\.sass-cache|dist|webpack\.config\.js|config\.mine\.js|node_modules/g.test(iPath)) {
                return false;
              } else {
                return true;
              }
            }

          );
          var sFiles = [];

          rFiles = rFiles.map((iPath) => {
            return util.joinFormat(path.relative(projectPath, iPath));
          });

          s01Files = s01Files.map((iPath) => {
            return util.joinFormat(path.relative(sourcePath01, iPath));
          });

          s02Files = s02Files.map((iPath) => {
            return util.joinFormat(path.relative(sourcePath02, iPath));
          });

          sFiles = s01Files.concat(s02Files);

          rFiles.sort((a, b) => {
            return a.localeCompare(b);
          });

          sFiles.sort((a, b) => {
            return a.localeCompare(b);
          });

          expect(rFiles).to.deep.equal(sFiles);

          fn.frag.destroy().then(() => {
            done();
          });
        }).catch((er) => {
          throw new Error(er);
        });
      });
    };

    iWorkflows.forEach((workflow) => {
      var inits = util.readdirSync(path.join(__dirname, '../examples', workflow), /^\./);
      inits.forEach((init) => {
        copyTask(workflow, init);
      });
    });
  });
}

if (TEST_CTRL.ALL) {
  if (TEST_CTRL.ALL_MAIN) {
    describe('yyl all test', () => {
      const workflows = util.readdirSync(path.join(__dirname, 'workflow-test'), /\.DS_Store|commons/);

      const FRAG_WORKFLOW_PATH = util.path.join(FRAG_PATH, 'workflow');
      const FRAG_COMMONS_PATH = util.path.join(FRAG_PATH, 'commons');
      workflows.forEach((workflow) => {
        it(workflow, function(DONE) {
          this.timeout(0);

          new util.Promise((next) => { // reset frag
            fn.frag.destroy().then(() => {
              next();
            });
          }).then((next) => { // build frag
            fn.frag.build();
            util.mkdirSync(FRAG_WORKFLOW_PATH);
            util.mkdirSync(FRAG_COMMONS_PATH);
            next();
          }).then((next) => { // copy file to frag
            util.copyFiles(path.join(__dirname, 'workflow-test', workflow), FRAG_WORKFLOW_PATH, () => {
              next();
            });
          }).then((next) => { // copy commons to frag
            util.copyFiles(path.join(__dirname, 'workflow-test/commons'), FRAG_COMMONS_PATH, () => {
              next();
            });
          }).then((next) => { // run yyl all
            yyl.run('all --silent --logLevel 0', FRAG_WORKFLOW_PATH).then(() => {
              next(util.getConfigSync({}));
            }).catch((er) => {
              throw new Error(er);
            });
          }).then((userConfig, next) => { // check
            const destRoot = userConfig.alias.destRoot;
            const htmls = util.readFilesSync(path.join(FRAG_WORKFLOW_PATH, 'dist'), /\.html$/);
            const csses = util.readFilesSync(path.join(FRAG_WORKFLOW_PATH, 'dist'), /\.css$/);
            const HTML_PATH_REG = /(src|href|data-main|data-original)\s*=\s*(['"])([^'"]*)(["'])/ig;
            const HTML_SCRIPT_REG = /(<script[^>]*>)([\w\W]*?)(<\/script>)/ig;
            const CSS_PATH_REG_1 = /(url\s*\(['"]?)([^'"]*?)(['"]?\s*\))/ig;
            const CSS_PATH_REG_2 = /(src\s*=\s*['"])([^'" ]*?)(['"])/ig;
            const REMOTE_SOURCE_REG = /^(http[s]?:|\/\/\w)/;
            const NO_PROTOCOL = /^\/\/(\w)/;
            const LOCAL_SOURCE_REG = /^\/\w/;
            const localSource = [];
            const remoteSource = [];
            const sourcePickup = function (iPath) {
              if (iPath.match(REMOTE_SOURCE_REG)) {
                remoteSource.push(iPath);
              } else if (iPath.match(LOCAL_SOURCE_REG)) {
                localSource.push(fn.hideUrlTail(util.path.join(destRoot, iPath)));
              }
            };

            expect(htmls.length).not.equal(0);

            htmls.forEach((html)=> {
              const cnt = fs.readFileSync(html).toString();
              cnt.replace(HTML_SCRIPT_REG, (str, $1, $2, $3) => {
                if (/type\s*=\s*['"]text\/html["']/.test($1)) {
                  return str;
                } else {
                  return $1 + querystring.escape($2) + $3;
                }
              }).replace(HTML_PATH_REG, (str, $1, $2, $3) => {
                sourcePickup($3);
                return str;
              });
            });
            csses.forEach((css) => {
              const cnt = fs.readFileSync(css).toString();
              cnt.replace(CSS_PATH_REG_1, (str, $1, $2) => {
                sourcePickup($2);
                return str;
              }).replace(CSS_PATH_REG_2, (str, $1, $2) => {
                sourcePickup($2);
                return str;
              });
            });

            const revPath = path.join(userConfig.alias.revDest, 'rev-manifest.json');
            delete require.cache[revPath];
            const hashMap = require(revPath);
            // check hash map exist
            expect(hashMap).not.equal(undefined);
            Object.keys(hashMap).forEach((key) => {
              if (key == 'version') {
                return;
              }
              const url1 = util.path.join(userConfig.alias.revRoot, key);
              const url2 = util.path.join(userConfig.alias.revRoot, hashMap[key]);

              expect(fs.existsSync(url1)).to.equal(true);
              expect(fs.existsSync(url2)).to.equal(true);
            });

            localSource.forEach((iPath) => {
              expect(fs.existsSync(iPath)).to.equal(true);
            });

            let padding = remoteSource.length;
            const paddingCheck = function () {
              if (!padding) {
                next();
              }
            };
            remoteSource.forEach((iPath) => {
              var rPath = iPath;
              if (rPath.match(NO_PROTOCOL)) {
                rPath = rPath.replace(NO_PROTOCOL, 'http://$1');
              }

              http.get(rPath, (res) => {
                expect(res.statusCode).to.equal(200);
                padding--;
                paddingCheck();
              });
            });
            paddingCheck();
          }).then(() => { // check
            fn.frag.destroy().then(() => {
              DONE();
            });
          }).start();
        });
      });
    });
  }
  if (TEST_CTRL.ALL_IS_COMMIT) {
    describe('yyl all --isCommit test', () => {
      const workflows = util.readdirSync(path.join(__dirname, 'workflow-test'), /\.DS_Store|commons/);

      const FRAG_WORKFLOW_PATH = util.path.join(FRAG_PATH, 'workflow');
      const FRAG_COMMONS_PATH = util.path.join(FRAG_PATH, 'commons');
      workflows.forEach((workflow) => {
        it(workflow, function(DONE) {
          this.timeout(0);

          new util.Promise((next) => { // reset frag
            fn.frag.destroy().then(() => {
              next();
            });
          }).then((next) => { // build frag
            fn.frag.build();
            util.mkdirSync(FRAG_WORKFLOW_PATH);
            util.mkdirSync(FRAG_COMMONS_PATH);
            next();
          }).then((next) => { // copy file to frag
            util.copyFiles(path.join(__dirname, 'workflow-test', workflow), FRAG_WORKFLOW_PATH, () => {
              next();
            });
          }).then((next) => { // copy commons to frag
            util.copyFiles(path.join(__dirname, 'workflow-test/commons'), FRAG_COMMONS_PATH, () => {
              next();
            });
          }).then((next) => { // run yyl all
            yyl.run('all --isCommit --silent --logLevel 0', FRAG_WORKFLOW_PATH).then(() => {
              next(util.getConfigSync({}));
            }).catch((er) => {
              throw new Error(er);
            });
          }).then((userConfig, next) => { // check
            const destRoot = userConfig.alias.destRoot;
            const htmls = util.readFilesSync(path.join(FRAG_WORKFLOW_PATH, 'dist'), /\.html$/);
            const csses = util.readFilesSync(path.join(FRAG_WORKFLOW_PATH, 'dist'), /\.css$/);
            const HTML_PATH_REG = /(src|href|data-main|data-original)\s*=\s*(['"])([^'"]*)(["'])/ig;
            const HTML_SCRIPT_REG = /(<script[^>]*>)([\w\W]*?)(<\/script>)/ig;
            const CSS_PATH_REG_1 = /(url\s*\(['"]?)([^'"]*?)(['"]?\s*\))/ig;
            const CSS_PATH_REG_2 = /(src\s*=\s*['"])([^'" ]*?)(['"])/ig;
            const REMOTE_SOURCE_REG = /^(http[s]?:|\/\/\w)/;
            const NO_PROTOCOL = /^\/\/(\w)/;
            const LOCAL_SOURCE_REG = /^\/\w/;
            const localSource = [];
            const remoteSource = [];
            const sourcePickup = function (iPath) {
              if (iPath.match(REMOTE_SOURCE_REG)) {
                remoteSource.push(iPath);
              } else if (iPath.match(LOCAL_SOURCE_REG)) {
                localSource.push(fn.hideUrlTail(util.path.join(destRoot, iPath)));
              }
            };

            expect(htmls.length).not.equal(0);

            htmls.forEach((html)=> {
              const cnt = fs.readFileSync(html).toString();
              cnt.replace(HTML_SCRIPT_REG, (str, $1, $2, $3) => {
                if (/type\s*=\s*['"]text\/html["']/.test($1)) {
                  return str;
                } else {
                  return $1 + querystring.escape($2) + $3;
                }
              }).replace(HTML_PATH_REG, (str, $1, $2, $3) => {
                sourcePickup($3);
                return str;
              });
            });
            csses.forEach((css) => {
              const cnt = fs.readFileSync(css).toString();
              cnt.replace(CSS_PATH_REG_1, (str, $1, $2) => {
                sourcePickup($2);
                return str;
              }).replace(CSS_PATH_REG_2, (str, $1, $2) => {
                sourcePickup($2);
                return str;
              });
            });

            const revPath = path.join(userConfig.alias.revDest, 'rev-manifest.json');
            delete require.cache[revPath];
            const hashMap = require(revPath);
            // check hash map exist
            expect(hashMap).not.equal(undefined);
            Object.keys(hashMap).forEach((key) => {
              if (key == 'version') {
                return;
              }
              const url1 = util.path.join(userConfig.alias.revRoot, key);
              const url2 = util.path.join(userConfig.alias.revRoot, hashMap[key]);

              expect(fs.existsSync(url1)).to.equal(true);
              expect(fs.existsSync(url2)).to.equal(true);
            });

            localSource.forEach((iPath) => {
              expect(fs.existsSync(iPath)).to.equal(true);
            });

            let padding = remoteSource.length;
            const paddingCheck = function () {
              if (!padding) {
                next();
              }
            };
            remoteSource.forEach((iPath) => {
              var rPath = iPath;
              if (rPath.match(NO_PROTOCOL)) {
                rPath = rPath.replace(NO_PROTOCOL, 'http://$1');
              }

              http.get(rPath, (res) => {
                expect(res.statusCode).to.equal(200);
                padding--;
                paddingCheck();
              });
            });
            paddingCheck();
          }).then(() => { // check
            fn.frag.destroy().then(() => {
              DONE();
            });
          }).start();
        });
      });
    });

  }

  if (TEST_CTRL.ALL_CONFIG) {
    describe('yyl all --config test', () => {
      const WORKFLOW_PATH = path.join(__dirname, 'workflow-test/gulp-requirejs');
      const COMMON_PATH = path.join(__dirname, 'workflow-test/commons');
      const FRAG_WORKFLOW_PATH = util.path.join(FRAG_PATH, 'workflow');
      const FRAG_COMMONS_PATH = util.path.join(FRAG_PATH, 'commons');
      const ABSOLUTE_CONFIG_PATH = util.path.join(FRAG_WORKFLOW_PATH, 'config.test.js');
      const RELATIVE_CONFIG_PATH = 'config.test.js';


      it(`yyl all --config ${ABSOLUTE_CONFIG_PATH} test`, function(done) {
        this.timeout(0);
        new util.Promise((next) => { // 项目文件初始化
          fn.frag.destroy();
          fn.frag.build();
          util.mkdirSync(FRAG_WORKFLOW_PATH);
          util.mkdirSync(FRAG_COMMONS_PATH);
          const obj = {};
          obj[WORKFLOW_PATH] = FRAG_WORKFLOW_PATH;
          obj[COMMON_PATH] = FRAG_COMMONS_PATH;
          util.copyFiles(obj, () => {
            next();
          });
        }).then(() => { // 项目执行
          yyl.run(`all --silent --config ${ABSOLUTE_CONFIG_PATH} --logLevel 0`, FRAG_WORKFLOW_PATH).then(() => {
            var serverConfig = util.getConfigSync({});
            var localConfig = util.extend(
              true,
              util.requireJs(path.join(FRAG_WORKFLOW_PATH, 'config.test.js')),
              util.requireJs(path.join(FRAG_WORKFLOW_PATH, './config.test.mine.js'))
            );
            var serverAlias = serverConfig.alias;
            var localAlias = localConfig.alias;
            Object.keys(serverAlias).forEach((key) => {
              if (!localAlias[key]) {
                return;
              }
              expect(
                util.path.join(serverAlias[key]).replace(/\/$/, '')
              ).to.deep.equal(
                util.path.join(FRAG_WORKFLOW_PATH, localAlias[key]).replace(/[/\\]+$/, '')
              );
            });
            fn.frag.destroy().then(() => {
              done();
            });
          }).catch((er) => {
            throw new Error(er);
          });
        }).start();
      });


      it(`yyl all --config ${RELATIVE_CONFIG_PATH}  test`, function(done) {
        this.timeout(0);
        new util.Promise((next) => { // 项目文件初始化
          fn.frag.destroy();
          fn.frag.build();
          util.mkdirSync(FRAG_WORKFLOW_PATH);
          util.mkdirSync(FRAG_COMMONS_PATH);
          const obj = {};
          obj[WORKFLOW_PATH] = FRAG_WORKFLOW_PATH;
          obj[COMMON_PATH] = FRAG_COMMONS_PATH;
          util.copyFiles(obj, () => {
            next();
          });
        }).then(() => { // 项目执行
          yyl.run(`all --silent --config ${RELATIVE_CONFIG_PATH} --logLevel 0`, FRAG_WORKFLOW_PATH).then(() => {
            var serverConfig = util.getConfigSync({});
            var
              localConfig = util.extend(
                true,
                util.requireJs(path.join(FRAG_WORKFLOW_PATH, 'config.test.js')),
                util.requireJs(path.join(FRAG_WORKFLOW_PATH, './config.test.mine.js'))
              );
            var serverAlias = serverConfig.alias;
            var localAlias = localConfig.alias;
            Object.keys(serverAlias).forEach((key) => {
              if (!localAlias[key]) {
                return;
              }
              expect(util.path.join(serverAlias[key]).replace(/\/$/, ''))
                .to.equal(util.path.join(FRAG_WORKFLOW_PATH, localAlias[key]).replace(/\/$/, ''));
            });
            fn.frag.destroy().then(() => {
              done();
            });
          }).catch((er) => {
            throw new Error(er);
          });
        }).start();
      });
    });
  }
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
if (TEST_CTRL.EXAMPLE) {
  describe('yyl example test', () => {
    it('yyl example', (done) => {
      yyl.run('yyl example --silent').then((iPath) => {
        expect(iPath).to.equal(util.joinFormat(util.vars.BASE_PATH, 'examples'));
        done();
      }).catch((er) => {
        throw new Error(er);
      });
    });
  });
}

if (TEST_CTRL.MAKE) {
  describe('yyl make test', () => {
    const workflows = util.readdirSync(path.join(__dirname, '../init-files'), /^\./);
    workflows.forEach((workflow) => {
      it(`yyl make for ${workflow}`, function(done) {
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
        }).then((next) => {
          yyl.run('make w-makedemo --silent --logLevel 0', FRAG_WORKFLOW_PATH).then(() => {
            let widgetPath = util.path.join(FRAG_WORKFLOW_PATH, 'src/components', 'w-makedemo');
            if (/webpack-vue|webpack-vue2|webpack/.test(workflow)) {
              widgetPath = util.path.join(FRAG_WORKFLOW_PATH, 'src/components/widget', 'w-makedemo');
            }

            const jsPath = util.path.join(widgetPath, 'w-makedemo.js');
            const scssPath = util.path.join(widgetPath, 'w-makedemo.scss');
            let pugPath;
            if (workflow == 'gulp-requirejs') {
              pugPath = util.path.join(widgetPath, 'w-makedemo.pug');
              let rConfigPath = util.path.join(FRAG_WORKFLOW_PATH, 'src/js/rConfig/rConfig.js');
              let rConfig = util.requireJs(rConfigPath);
              expect(rConfig.paths.wMakedemo).to.equal(util.path.relative(
                util.path.join(FRAG_WORKFLOW_PATH, 'src/js/rConfig'),
                util.path.join(FRAG_WORKFLOW_PATH, 'src/components', 'w-makedemo/w-makedemo')
              ));
            } else {
              pugPath = util.path.join(widgetPath, 'w-makedemo.jade');
              let configPath = util.path.join(FRAG_WORKFLOW_PATH, 'config.js');
              let config = util.requireJs(configPath);
              expect(config.alias.wMakedemo).to.equal(util.path.relative(
                util.path.join(FRAG_WORKFLOW_PATH),
                util.path.join(widgetPath, 'w-makedemo.js')
              ));
            }

            expect([
              jsPath,
              fs.existsSync(jsPath)
            ]).to.deep.equal([
              jsPath,
              true
            ]);

            expect([
              pugPath,
              fs.existsSync(pugPath)
            ]).to.deep.equal([
              pugPath,
              true
            ]);

            expect([
              scssPath,
              fs.existsSync(scssPath)
            ]).to.deep.equal([
              scssPath,
              true
            ]);

            next();
          }).catch((er) => {
            throw new Error(er);
          });
        }).then((next) => {
          yyl.run('make p-makedemo --silent --logLevel 0', FRAG_WORKFLOW_PATH).then(() => {
            let widgetPath = util.path.join(FRAG_WORKFLOW_PATH, 'src/components', 'p-makedemo');
            if (/webpack-vue|webpack-vue2/.test(workflow)) {
              widgetPath = util.path.join(FRAG_WORKFLOW_PATH, 'src/components/page', 'p-makedemo');
            }
            expect([
              fs.existsSync(util.path.join(widgetPath, 'p-makedemo.js')),
              fs.existsSync(util.path.join(widgetPath, `p-makedemo.${workflow == 'gulp-requirejs' ? 'pug': 'jade'}`)),
              fs.existsSync(util.path.join(widgetPath, 'p-makedemo.scss'))
            ]).to.deep.equal([
              true,
              true,
              true
            ]);
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

if (TEST_CTRL.UPDATE) {
  describe('yyl update test', () => {
    it('yyl update 2.15.0', function(done) {
      this.timeout(0);
      yyl.run('update 2.15.0 --silent --logLevel 0').then(() => {
        expect(true).equal(true);
        done();
      }).catch((er) => {
        throw new Error(er);
      });
    });

    it('yyl update', function(done) {
      this.timeout(0);
      yyl.run('update --silent --logLevel 0').then(() => {
        expect(true).equal(true);
        done();
      }).catch((er) => {
        throw new Error(er);
      });
    });
  });
}
