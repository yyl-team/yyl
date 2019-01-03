const extFs = require('yyl-fs');
const path = require('path');
const fs = require('fs');
const util = require('yyl-util');


const seed = require('../../tasks/w-seed.js');
const extFn = require('../../tasks/w-extFn.js');
const yyl = require('../../index.js');
const SEED = require('../../tasks/w-seed.js');


const FRAG_PATH = path.join(__dirname, '../__frag');

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
seed.workflows.forEach((workflow) => {
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

cmds.forEach((cmd) => {
  module.exports[cmd] = function (client) {
    let testUrl = '';
    client
      // 环境启动
      .perform(async (done) => {
        const seedPath = path.join(FRAG_PATH, cmd.split(' ').join('-'));
        const distPath = path.join(seedPath, 'dist');

        if (fs.existsSync(FRAG_PATH)) {
          await extFs.removeFiles(FRAG_PATH);
        } else {
          await extFs.mkdirSync(FRAG_PATH);
        }

        extFs.mkdirSync(seedPath);

        await yyl.run(cmd, seedPath);

        await extFn.waitFor(1000);

        await yyl.run('yyl watch --silent', seedPath);
        const htmls = await extFs.readFilePaths(distPath, (iPath) => /\.html$/.test(iPath));
        client.assert.equal(htmls.length !== 0, true);

        testUrl = util.path.join('http://127.0.0.1:5000', path.relative(distPath, htmls[0]));
        done();
      })
      .checkPageError(testUrl)
      // 环境关闭
      .perform(async (done) => {
        await yyl.server.abort();
        done();
      })
      .end();
  };
});
