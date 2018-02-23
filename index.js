'use strict';
var cmd = require('./tasks/w-cmd.js');
var util = require('./tasks/w-util.js');
var r = {
  run: function(ctx, cwd) {
    var iArgv = ctx.split(/\s+/);

    if (iArgv[0] == 'yyl') {
      iArgv = iArgv.slice(1);
    }
    iArgv.push('--nocatch');

    var CWD = cwd || process.cwd();

    // 变量更新
    util.vars.PROJECT_PATH = CWD;
    util.vars.USER_CONFIG_FILE = util.joinFormat(CWD, 'config.js');
    util.vars.USER_PKG_FILE = util.joinFormat(CWD, 'package.json');

    return cmd.apply(global, iArgv);
  },
  server: require('./tasks/w-server.js')

};


module.exports = r;
