'use strict';
var 
    fs = require('fs'),
    util = require('yyl-util'),
    path = require('path');


module.exports = function(){
    var 
        pkgPath = path.join(util.vars.PROJECT_PATH, 'package.json'),
        pkg;

    if(fs.existsSync(pkgPath)){
        pkg = require(pkgPath);

        if(pkg.name == 'yyl'){
            var cmd = 'npm link';
            util.runCMD(cmd, function(err){
                if(err){
                    return util.msg.warn('start debug mode fail.', err);
                }

                util.msg.success('change yyl path', util.vars.BASE_PATH, '=>', util.vars.PROJECT_PATH);

            }, util.vars.PROJECT_PATH);

        } else {
            util.msg.warn('start debug mode fail.', 'current path is not yyl project');
        }

    } else {
        util.msg.warn('start debug mode fail.', 'package.json is not exist');
    }

};
