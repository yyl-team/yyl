'use strict';
var 
    path = require('path'),
    fs = require('fs'),
    util = require('../lib/yyl-util'),
    vars = util.vars;

module.exports = function(){
    var iEnv = util.envPrase(arguments),
        iCmd = '';

    if(iEnv.version){
        if(iEnv.version === true){
            var configPath = path.join(vars.PROJECT_PATH, 'config.js');
            if(fs.existsSync(configPath)){
                var iConfig = util.requireJs(configPath);

                if(iEnv.name){
                    if(!iConfig[iEnv.name]){
                        return util.msg.error('yyl update fail,', 'config.' + iEnv.name, 'is not exist');
                    }

                    iConfig = iConfig[iEnv.name];
                }

                var iVer = iConfig.version;

                if(!iVer){
                    return util.msg.warn('yyl update fail,', 'version is not in your configfile');
                }

                iCmd = 'git checkout ' + iVer;

            } else {
                return util.msg.error('yyl update fail,', 'config.js is not exist:', configPath);

            }

        } else {
            iCmd = 'git checkout ' + iEnv.version;
        }

    } else {
        iCmd = 'git checkout master';
    }

    if(iCmd){
        util.runCMD( iCmd, function(err){
            if(err){
                return util.msg.error('yyl update error', err);
            }

            util.msg.line().success('yyl update complete');

        }, path.join(__dirname, '../'));

    }

};
