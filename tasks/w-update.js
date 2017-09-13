'use strict';
var util = require('yyl-util');
var wServer = require('./w-server.js');

var
    update = function(version){
        wServer.clear(function(){
            var iCmd = 'npm install yyl -g';
            if(version){
                iCmd = 'npm install yyl@' + version + ' -g';
            }
            util.msg.info('clear done please input cmd:');
            util.msg.info(iCmd);
        });

    };

module.exports = update;
