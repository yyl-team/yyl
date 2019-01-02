const extFs = require('yyl-fs');
const path = require('path');
const fs = require('fs');

const seed = require('../../tasks/w-seed.js');
const extFn = require('../../tasks/w-extFn.js');
const yyl = require('../../index.js');

const FRAG_PATH = path.join(__dirname, './__frag');

seed.workflows.forEach((workflow) => {
  module.exports[`${workflow} run test`] = function (client) {
    client
      // 环境启动
      .perform(async (done) => {
        const seedPath = path.join(FRAG_PATH, workflow);

        if (fs.existsSync(FRAG_PATH)) {
          await extFs.removeFiles(FRAG_PATH);
        } else {
          await extFs.mkdirSync(FRAG_PATH);
        }

        extFs.mkdirSync(seedPath);

        await yyl.init({
          name: workflow,
          platform: yyl.init.PLATFORMS[0],
          commitType: yyl.init.COMMIT_TYPES[0],
          silent: true
        });

        await extFn.waitFor(2000);

        await yyl.run('yyl watch --proxy --silent', seedPath);
        done();
      })
      // 环境关闭
      .perform(async (done) => {
        await yyl.server.abort();
        done();
      })
      .end();
  };
});
// module.exports = {
//   'yyl all usage': function (client) {
//     clietn.perform(async (done) => {

//     });
//   }
// };
