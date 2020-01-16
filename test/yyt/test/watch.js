const util = require('yyl-util');
const extFs = require('yyl-fs');
const fs = require('fs');
const tUtil = require('yyl-seed-test-util');
const path = require('path');
const request = require('yyl-request');
const chalk = require('chalk');

const yyl = require('../../index.js');
const TEST_CTRL = require('../test.config.js');
const FRAG_PATH = path.join(__dirname, '../__frag');
const ORI_PATH = path.join(__dirname, '../../test/workflow-test');

tUtil.frag.init(FRAG_PATH);

module.exports['@disabled'] = !TEST_CTRL.WATCH;

const CASE_PATHS = (() => {
  const dirs = fs.readdirSync(ORI_PATH).filter((name) => {
    return !/commons|^\./.test(name);
  });

  return dirs.map((name) => path.join(ORI_PATH, name));
})();


CASE_PATHS.forEach((tPath, index) => {
  const filename = path.relative(ORI_PATH, tPath);
  const seedPath = path.join(FRAG_PATH, `watch-test-${filename}`);
  const distPath = path.join(seedPath, 'dist');
  let scssReadPath = '';
  let scssFilter = null;


  module.exports[`${filename} watch test`] = function (client) {
    client
      // 环境启动
      .perform(async (done) => {
        if (index === 0) {
          await tUtil.frag.build();
          await extFs.copyFiles(path.join(ORI_PATH, 'commons'), path.join(FRAG_PATH, 'commons'));
        }
        await extFs.copyFiles(tPath, seedPath);

        const runConfig = await yyl.run('watch --silent', seedPath);
        const htmls = await extFs.readFilePaths(distPath, (iPath) => /\.html$/.test(iPath));
        client.verify.ok(htmls.length !== 0, `build ${chalk.yellow.bold(htmls.length)} html files`);
        const testUrl = util.path.join(
          runConfig.localserver.serverAddress,
          path.relative(runConfig.alias.destRoot, htmls[0])
        );
        switch (runConfig.workflow) {
          case 'gulp-requirejs':
            scssReadPath = path.join(seedPath, 'src/components');
            scssFilter = function (iPath) {
              return /\.scss$/.test(iPath) && /\/p-/.test(util.path.join(iPath));
            };

            break;

          case 'webpack-vue2':
            scssReadPath = path.join(seedPath, 'src/entry');
            scssFilter = function (iPath) {
              return /\.scss$/.test(iPath);
            };
            break;

          default:
            break;

        }

        const [, res ] = await request(testUrl);
        client.verify.ok(res.statusCode === 200, `${chalk.yellow('GET')} ${testUrl} ${chalk.green('200')}`);
        client.checkPageError(testUrl);
        done();
      })
      .perform(async (done) => {
        let scssPaths = await extFs.readFilePaths(scssReadPath, scssFilter);

        client.verify.ok(scssPaths.length !== 0, `expect have ${scssPaths.length} scss files: [${scssPaths[0]}]`);
        const iScss = scssPaths[0];
        let scssCnt = fs.readFileSync(iScss).toString();
        scssCnt += '\nbody {background-color: red;}';
        fs.writeFileSync(iScss, scssCnt);
        done();
      })
      .waitFor(2000)
      .getCssProperty('body', 'background-color', (result) => {
        client.verify.ok(result.value === 'rgba(255, 0, 0, 1)', `expect body turning red ${result.value}`);
      })
      // 环境关闭
      .end(async () => {
        await yyl.server.abort();
        // if (index === cmds.length - 1) {
        //   await tUtil.frag.destroy();
        // }
      });
  };
});
