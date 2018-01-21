'use strict';
// WebdriverIO
const expect = require('chai').expect;
const path = require('path');
const fs = require('fs');
const util = require('yyl-util');
const querystring = require('querystring');
const http = require('http');

const yyl = require('../index.js');
const FRAG_PATH = path.join(__dirname, '__frag');
const FRAG_PATH2 = path.join(__dirname, '__frag2');

util.cleanScreen();

const fn = {
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

      yyl.run(`init ${util.envStringify({
        name: FRAG_PATH.split(/[/\\]+/).pop(),
        platform: 'pc',
        workflow: workflow,
        init: init,
        doc: 'git',
        silent: true
      })}`, () => { // 文件校验
        var rFiles = util.readFilesSync(projectPath);
        var s01Files = util.readFilesSync(sourcePath01, (iPath) => {
          var relativePath = util.joinFormat(path.relative(sourcePath01, iPath));
          if (/readme\.md|\.gitignore/i.test(iPath) && !/node_modules/.test(relativePath)) {
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
      }, FRAG_PATH);
    });
  };

  iWorkflows.forEach((workflow) => {
    var inits = util.readdirSync(path.join(__dirname, '../examples', workflow), /^\./);
    inits.forEach((init) => {
      copyTask(workflow, init);
    });
  });



  // it('yyl init --doc svn test', function(done){
  //     // TODO
  //     done();
  // });

  // it('yyl init --platform moble test', function(done){
  //     // TODO
  //     done();
  // });


  // it('yyl init --name any test', function(done){
  //     // TODO
  //     done();
  // });
});

describe('yyl all test', () => {
  const workflows = util.readdirSync(path.join(__dirname, 'workflow-test'), /\.DS_Store/);
  workflows.forEach((workflow) => {
    it(workflow, function(DONE) {
      this.timeout(0);
      fn.frag.destory();
      fn.frag.build();
      new util.Promise((next) => { // copy file to frag
        util.copyFiles(path.join(__dirname, 'workflow-test', workflow), FRAG_PATH, () => {
          next();
        });
      }).then((next) => { // run yyl all
        yyl.run('all --silent', () => {
          next(util.getConfigSync({}));
        }, FRAG_PATH);
      }).then((userConfig, next) => { // check
        const destRoot = userConfig.alias.destRoot;
        const htmls = util.readFilesSync(path.join(FRAG_PATH, 'dist'), /\.html$/);
        const csses = util.readFilesSync(path.join(FRAG_PATH, 'dist'), /\.css$/);
        const HTML_PATH_REG = /(src|href|data-main|data-original)\s*=\s*(['"])([^'"]*)(["'])/ig;
        const HTML_SCRIPT_REG = /(<script[^>]*>)([\w\W]*?)(<\/script>)/ig;
        const CSS_PATH_REG_1 = /(url\s*\(['"]?)([^'"]*?)(['"]?\s*\))/ig;
        const CSS_PATH_REG_2 = /(src\s*=\s*['"])([^'" ]*?)(['"])/ig;
        const REMOTE_SOURCE_REG = /^(http[s]?:|\/\/\w)/;
        const LOCAL_SOURCE_REG = /^\/\w/;
        const localSource = [];
        const remoteSource = [];
        const sourcePickup = function (iPath) {
          if (iPath.match(REMOTE_SOURCE_REG)) {
            remoteSource.push(iPath);
          } else if (iPath.match(LOCAL_SOURCE_REG)) {
            localSource.push(util.path.join(destRoot, iPath));
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

        localSource.forEach((iPath) => {
          expect(fs.existsSync(iPath)).equal(true);
        });

        let padding = remoteSource.length;
        const paddingCheck = function () {
          if (!padding) {
            next();
          }
        };
        remoteSource.forEach((iPath) => {
          http.get(iPath, (res) => {
            expect(res.statusCode).equal(200);
            padding--;
            paddingCheck();
          });
        });
        paddingCheck();



        next();
      }).then(() => { // check
        fn.frag.destory();
        DONE();
      }).start();
    });
  });
});

