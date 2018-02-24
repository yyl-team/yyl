'use strict';
// WebdriverIO
const expect = require('chai').expect;
const path = require('path');
const fs = require('fs');
const util = require('yyl-util');
const querystring = require('querystring');
const http = require('http');
// const webdriverio = require('webdriverio');

const yyl = require('../index.js');
const FRAG_PATH = path.join(__dirname, '__frag');
const FRAG_PATH2 = path.join(__dirname, '__frag2');

util.cleanScreen();

const fn = {
  hideUrlTail: function(url) {
    return url
      .replace(/\?.*?$/g, '')
      .replace(/#.*?$/g, '');
  },
  frag: {
    build: function() {
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
    },
    destory: function() {
      if (fs.existsSync(FRAG_PATH)) {
        util.removeFiles(FRAG_PATH, true);
      }

      if (fs.existsSync(FRAG_PATH2)) {
        util.removeFiles(FRAG_PATH2, true);
      }
    }
  }
};

fn.frag.destory();

describe('yyl init test', () => {
  var iWorkflows = util.readdirSync(path.join(__dirname, '../init-files'), /^\./);
  var copyTask = function(workflow, init) {
    it(`yyl init copy test, ${workflow}:${init}`, function(done) {
      this.timeout(0); // 设置用例超时时间
      fn.frag.destory();
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
            if (/package\.json|gulpfile\.js|\.DS_Store|\.sass-cache|dist|webpack\.config\.js|config\.mine\.js|node_modules/g.test(iPath)) {
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

        fn.frag.destory();
        done();
      }).catch((er) => {
        expect(er).equal(undefined);
        fn.frag.destory();
        done();
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

describe('yyl all test', () => {
  const workflows = util.readdirSync(path.join(__dirname, 'workflow-test'), /\.DS_Store|commons/);
  const FRAG_WORKFLOW_PATH = util.path.join(FRAG_PATH, 'workflow');
  const FRAG_COMMONS_PATH = util.path.join(FRAG_PATH, 'commons');
  workflows.forEach((workflow) => {
    it(workflow, function(DONE) {
      this.timeout(0);

      new util.Promise((next) => { // reset frag
        fn.frag.destory();
        next();
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
          expect(er).equal(undefined);
          fn.frag.destory();
          DONE();
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
          const EXPECT_TL = 'hashMap file exist';
          const url1 = util.path.join(userConfig.alias.revRoot, key);
          const url2 = util.path.join(userConfig.alias.revRoot, hashMap[key]);

          expect([
            EXPECT_TL,
            url1,
            fs.existsSync(url1)
          ]).to.deep.equal([
            EXPECT_TL,
            url1,
            true
          ]);

          expect([
            EXPECT_TL,
            url2,
            fs.existsSync(url2)
          ]).to.deep.equal([
            EXPECT_TL,
            url2,
            true
          ]);
        });

        localSource.forEach((iPath) => {
          const EXPECT_TL = 'localsource exist check';
          expect([
            EXPECT_TL,
            iPath,
            fs.existsSync(iPath)
          ]).to.deep.equal([
            EXPECT_TL,
            iPath,
            true
          ]);
        });

        let padding = remoteSource.length;
        const paddingCheck = function () {
          if (!padding) {
            next();
          }
        };
        remoteSource.forEach((iPath) => {
          var rPath = iPath;
          var EXPECT_TL = 'remote url check';
          if (rPath.match(NO_PROTOCOL)) {
            rPath = rPath.replace(NO_PROTOCOL, 'http://$1');
          }

          http.get(rPath, (res) => {
            expect([
              EXPECT_TL,
              rPath,
              res.statusCode
            ]).to.deep.equal([
              EXPECT_TL,
              rPath,
              200
            ]);
            padding--;
            paddingCheck();
          });
        });
        paddingCheck();
      }).then(() => { // check
        fn.frag.destory();
        DONE();
      }).start();
    });
  });
});

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
      fn.frag.destory();
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
      yyl.run(`all --silent --config ${ABSOLUTE_CONFIG_PATH}`, FRAG_WORKFLOW_PATH).then(() => {
        var serverConfig = util.getConfigSync({});
        var localConfig = util.extend(
          true,
          util.requireJs(path.join(FRAG_WORKFLOW_PATH, 'config.test.js')),
          util.requireJs(path.join(FRAG_WORKFLOW_PATH, './config.test.mine.js'))
        );
        var serverAlias = serverConfig.alias;
        var localAlias = localConfig.alias;
        Object.keys(serverAlias).forEach((key) => {
          expect({
            key: key,
            val: util.path.join(serverAlias[key])
          }).to.deep.equal({
            key: key,
            val: util.path.join(FRAG_WORKFLOW_PATH, localAlias[key]).replace(/\/$/, '')
          });
        });
        fn.frag.destory();
        done();
      }).catch((er) => {
        expect(er).equal(undefined);
        fn.frag.destory();
        done();
      });
    }).start();
  });


  it(`yyl all --config ${RELATIVE_CONFIG_PATH}  test`, function(done) {
    this.timeout(0);
    new util.Promise((next) => { // 项目文件初始化
      fn.frag.destory();
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
      yyl.run(`all --silent --config ${RELATIVE_CONFIG_PATH}`, FRAG_WORKFLOW_PATH).then(() => {
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
          expect(util.path.join(serverAlias[key]))
            .to.equal(util.path.join(FRAG_WORKFLOW_PATH, localAlias[key]).replace(/\/$/, ''));
        });
        fn.frag.destory();
        done();
      }).catch((er) => {
        expect(er).equal(undefined);
        fn.frag.destory();
        done();
      });
    }).start();
  });
});
// describe('yyl server test', () => {
//   it('yyl server start', (done) => {
//     yyl.run('server start --logLevel 0').then((config) => {
//       expect(config).not.equal(undefined);
//       done();
//     }).catch((er) => {
//       expect(er).equal(undefined);
//       done();
//     })

//   });
//   it('yyl server clear', (done) => {

//   });
// });
