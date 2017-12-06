'use strict';

var fs = require('fs'),
    _ = require('./w-util.js'),
    path = require('path');

module.exports = function () {
    var 
        iArgv = Array.from(arguments),
        newComponentName = iArgv[1],
        componentsPath = path.join(_.vars.PROJECT_PATH, 'src/pc/components'),
        newComponentDir = path.join(componentsPath, newComponentName),
        extensions = ['.js', '.jade', '.scss'];


    function mkdir(path) {
        return new Promise((resolve, reject) => {
            fs.mkdir(path, (err) => {
                if (err) {
                    reject(err)
                }
                resolve(`Made component dir: ${newComponentDir}`)
            })
        })
    }


    mkdir(newComponentDir).then((msg) => {
        _.logSuccess(msg)

        extensions.map((extension) => {
            let fileName = path.join(newComponentDir, newComponentName+extension);
            try {
                fs.openSync(fileName, 'a')
                _.logSuccess(`Created file: ${fileName}`)
            } catch(e) {
                _.logError(`Create file failed: ${e}`)
            }
        });

    }).catch((err) => {
        _.logError(err)
    })

};

