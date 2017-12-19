'use strict';
var 
    cmd = require('./tasks/w-cmd.js'),
    util = require('./tasks/w-util.js'),
    r = {
        run: function(){
            var iArgv = util.makeArray(arguments);
            if(iArgv[0] == 'yyl'){
                iArgv = iArgv.slice(1);
            }
            cmd.apply(global, iArgv);
        }

    };


module.exports = r;
