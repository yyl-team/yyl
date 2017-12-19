'use strict';
var 
    cmd = require('./tasks/w-cmd.js'),
    util = require('./tasks/w-util.js'),
    r = {
        run: function(){
            var iArgv = util.makeArray(arguments);
            cmd.apply(global, iArgv);
        }

    };


module.exports = r;
