'use strict';
var 
    cmd = require('./tasks/w-cmd.js'),
    r = {
        run: function(ctx, done, cwd){
            var iArgv = ctx.split(/\s+/);


            if(iArgv[0] == 'yyl'){
                iArgv = iArgv.slice(1);
            }

            global.YYL_RUN_CWD = cwd;
            global.YYL_RUN_CALLBACK = function(){
                global.YYL_RUN_CALLBACK = null;
                return done && done();
            };
            cmd.apply(global, iArgv);
        },
        server: require('./tasks/w-server.js')

    };


module.exports = r;
