const cmd = require('./tasks/w-cmd.js');
const util = require('./tasks/w-util.js');
const server = require('./tasks/w-server.js');

const init = require('./tasks/w-init.js');


const r = {
  run: async (ctx, cwd) => {
    let iArgv = ctx.split(/\s+/);

    if (iArgv[0] == 'yyl') {
      iArgv = iArgv.slice(1);
    }
    iArgv.push('--nocatch');

    const CWD = cwd || process.cwd();

    // 变量更新
    util.vars.PROJECT_PATH = CWD;
    util.vars.USER_CONFIG_FILE = util.joinFormat(CWD, 'config.js');
    util.vars.USER_PKG_FILE = util.joinFormat(CWD, 'package.json');

    return cmd(...iArgv);
  },
  server,
  init
};


module.exports = r;
