'use strict';
var 
    cmd = require('./tasks/w-cmd.js'),
    r = {
        run: function(ctx, done){
            var iArgv = ctx.split(/\s+/);
            if(iArgv[0] == 'yyl'){
                iArgv = iArgv.slice(1);
            }
            global.YYL_RUN_CALLBACK = function(){
                global.YYL_RUN_CALLBACK = null;
                return done && done();
            };
            cmd.apply(global, iArgv);
        }

    };


module.exports = r;
