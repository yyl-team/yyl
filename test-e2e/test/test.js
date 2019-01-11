const extFs = require('yyl-fs');
const path = require('path');
const fs = require('fs');
const util = require('yyl-util');
const request = require('request');
const chalk = require('chalk');


const seed = require('../../tasks/w-seed.js');
// const extFn = require('../../tasks/w-extFn.js');
const yyl = require('../../index.js');
const SEED = require('../../tasks/w-seed.js');


const FRAG_PATH = path.join(__dirname, '../__frag');

const fn = {
  waitFor (ms) {
    return new Promise ((next) => {
      setTimeout(() => {
        next();
      }, ms);
    });
  },
  get(url) {
    return new Promise((next, reject) => {
      request({
        method: 'GET',
        url
      }, (error, res, body) => {
        if (error) {
          return reject(error);
        }
        next([res, body]);
      });
    });
  }
};

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

// cmds.length = 1;
cmds.forEach((cmd, index) => {
  module.exports[cmd] = function (client) {
    client
      // 环境启动
      .perform(async (done) => {
        const seedPath = path.join(FRAG_PATH, cmd.split(' ').join('-'));
        const distPath = path.join(seedPath, 'dist');

        if (index === 0) {
          if (!fs.existsSync(FRAG_PATH)) {
            await extFs.removeFiles(FRAG_PATH);
          } else {
            await extFs.mkdirSync(FRAG_PATH);
          }
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

        const [ res ] = await fn.get(testUrl);
        client.verify.ok(res.statusCode === 200, `${chalk.yellow('GET')} ${testUrl} ${chalk.green('200')}`);
        client.checkPageError(testUrl);
        done();
      })
      // 环境关闭
      .perform(async (done) => {
        await yyl.server.abort();
        if (index === cmds.length - 1) {
          await extFs.removeFiles(FRAG_PATH);
        }
        done();
      })
      .end();
  };
});


