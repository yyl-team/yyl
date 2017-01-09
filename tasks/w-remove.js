'use strict';

var 
    fs = require('fs'),
    util = require('../lib/yyl-util.js'),
    vars = util.vars,
    path = require('path');

var 
    remove = function(iPath, done){
        var tPath = '';
        if(path.isAbsolute(iPath)){
            tPath = iPath;

        } else {
            tPath = util.joinFormat(vars.PROJECT_PATH, iPath);
        }

        var iBaseName = path.basename(tPath);

        if(iBaseName == 'node_modules'){
            var iPromise = new util.Promise();
            var dirList = fs.readdirSync(tPath);

            dirList.forEach(function(pathname){
                var filePath = path.join(tPath, pathname);

                if(/ /.test(pathname)){
                    return util.msg.warn('filename with space, cannot remove:', pathname);
                }

                if(!fs.statSync(filePath).isDirectory()){
                    return;
                }

                if(/\.bin/.test(pathname)){
                    return;
                }

                iPromise.then(function(next){

                    util.msg.info('clearing path:', tPath);
                    util.removeFiles(tPath, function(err){
                        if(err){
                            util.msg.warn('remove files error', err);

                            var iCmd = 'npm uninstall ' + pathname;
                            util.msg.info('run cmd', iCmd);

                            util.runCMD( iCmd, function(err){
                                if(err){
                                    util.msg.warn( iCmd + ' run error:', err);
                                }
                                next();
                            });

                        } else {
                            util.msg.success('done');
                            next();
                        }

                    });
                    
                });
            });
            iPromise.then(function(){
                util.msg.success('done');
                util.removeFiles(tPath, function(err){
                    if(err){
                        util.msg.warn('remove files error', err);
                    } else {
                        util.msg.success('done');
                    }

                    if(typeof done == 'function'){
                        done(err);
                    }

                });
            });

            iPromise.start();

        } else {
            util.removeFiles(tPath, function(err){
                if(err){
                    util.msg.warn('remove files error', err);
                } else {
                    util.msg.success('done');
                }

                if(typeof done == 'function'){
                    done(err);
                }

            });

        }

    };


module.exports = remove;
