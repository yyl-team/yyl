'use strict';

var fs = require('fs'),
    util = require('./w-util.js'),
    touch = require('touch'),
    path = require('path'),
    mkdirp = require('mkdirp');

module.exports = function () {
    var 
        iArgv = util.makeArray(arguments);
        
    console.log('argsments', iArgv);

    var componentsPath = path.join(util.vars.PROJECT_PATH, 'src/pc/components');
    
    mkdirp(path.join(__dirname, 'sb'), function (err) {
        if (err) console.error(err);
        else console.log('pow');
    });


    // var componentName = iArgv[1];
    
    // var extensions = ['.js', '.jade', '.scss'];
     
    // var newFiles = extensions.map(function (e) {
    //     return path.join(componentsPath, componentName, componentName+e);
    // });

    // function touchFile(filename) {
    //     mkdirp(path.dirname(filename), function (err) {
    //         if (err) throw new Error('can\'t create dir: ', err);
    //         touch.sync(filename);
    //         console.log(filename, ' created');
    //     });
    // }

    // newFiles.forEach(touchFile);
};

