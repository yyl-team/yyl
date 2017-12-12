'use strict';
var util = require('./w-util.js');
var wServer = require('./w-server.js');

var
    update = function(version){
        var iCmd = 'git checkout master & git pull';
        if(version){
            iCmd = 'git checkout '+ version +' & git pull';
        }
        util.msg.info(iCmd);
    };

module.exports = update;
