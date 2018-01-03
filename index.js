'use strict';
var 
    cmd = require('./tasks/w-cmd.js'),
    util = require('./tasks/w-util.js'),
    r = {
        run: function(ctx, done, cwd){
            var iArgv = ctx.split(/\s+/);

            if(iArgv[0] == 'yyl'){
                iArgv = iArgv.slice(1);
            }

            var CWD = cwd || process.cwd();

            // 变量更新
            util.vars.PROJECT_PATH = CWD;
            util.vars.USER_CONFIG_FILE = util.joinFormat(CWD, 'config.js');
            util.vars.USER_PKG_FILE = util.joinFormat(CWD, 'package.json');

            global.YYL_RUN_CALLBACK = function(){
                global.YYL_RUN_CALLBACK = null;
                return done && done();
            };

            cmd.apply(global, iArgv);
        },
        server: require('./tasks/w-server.js')

    };


module.exports = r;
