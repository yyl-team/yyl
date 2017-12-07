'use strict';
var util = require('./w-util.js');
var wServer = require('./w-server.js');

var
    update = function(version){
        var iCmd = 'git pull origin/master';
        if(version){
            iCmd = 'git pull origin/' + version;
        }
        util.msg.info(iCmd);
    };

module.exports = update;
