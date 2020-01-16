const extFs = require('yyl-fs');
const path = require('path');
const util = require('yyl-util');
const tUtil = require('yyl-seed-test-util');
const request = require('yyl-request');
const chalk = require('chalk');

const yyl = require('../../index.js');
const SEED = require('../../tasks/seed.js');
const TEST_CTRL = require('../test.config.js');


const FRAG_PATH = path.join(__dirname, '../__frag');

tUtil.frag.init(FRAG_PATH);

module.exports['@disabled'] = !TEST_CTRL.INIT;

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
  // if (workflow === 'gulp-requirejs') {
  //   return;
  // }
  const seed = SEED.find(workflow);
  ['pc', 'mobile'].forEach((platform) => {
    seed.examples.forEach((example) => {
      yyl.init.ENV.COMMIT_TYPES.forEach((commitType) => {
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

// cmds.length = 1;
cmds.forEach((cmd, index) => {
  module.exports[cmd] = function (client) {
    client
      // 环境启动
      .perform(async (done) => {
        const seedPath = path.join(FRAG_PATH, cmd.split(' ').join('-'));
        const distPath = path.join(seedPath, 'dist');

        if (index === 0) {
          await tUtil.frag.build();
        }

        extFs.mkdirSync(seedPath);

        await yyl.run(cmd, seedPath);

        const runConfig = await yyl.run('watch --silent', seedPath);
        const htmls = await extFs.readFilePaths(distPath, (iPath) => /\.html$/.test(iPath));

        client.verify.ok(htmls.length !== 0, `build ${chalk.yellow.bold(htmls.length)} html files`);
        const testUrl = util.path.join(
          runConfig.localserver.serverAddress,
          path.relative(runConfig.alias.destRoot, htmls[0])
        );

        const [, res ] = await request(testUrl);
        client.verify.ok(res.statusCode === 200, `${chalk.yellow('GET')} ${testUrl} ${chalk.green('200')}`);
        client.checkPageError(testUrl);
        done();
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


