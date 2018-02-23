'use strict';
const path = require('path');
const fs = require('fs');

const util = require('./w-util.js');
const wServer = require('./w-server.js');
const log = require('./w-log.js');

var jade2pug = {
  init: function(op) {
    const runner = (done) => {
      new util.Promise(((next) => {
        log('start', 'jade2pug');
        log('msg', 'info', 'build server config start');

        // 创建 server 端 config
        wServer.buildConfig(op.name, op).then((config) => {
          log('msg', 'success', 'build server config finished');
          next(config);
        }).catch((err) => {
          throw new Error(err);
        });
      })).then((config) => {
        var
          jadeFiles = util.readFilesSync(config.alias.srcRoot, (iPath) => {
            if (path.extname(iPath) == '.jade') {
              return true;
            }
          });

        // jade file 重命名
        jadeFiles.forEach((iPath) => {
          var pugPath = iPath.replace(/\.jade$/, '.pug');

          fs.writeFileSync(pugPath, fs.readFileSync(iPath));
          util.removeFiles(iPath);
          log('msg', 'del', iPath);
          log('msg', 'create', pugPath);
        });

        log('msg', 'success', 'yyl pug2dest finished');
        log('finish');
        done();
      }).start();
    };

    return new Promise((next) => {
      runner(next);
    });
  },
  // 获取所有 jade 文件
  run: function() {
    var iArgv = util.makeArray(arguments);
    var op = util.envParse(iArgv);

    return jade2pug.init(op);
  }
};


module.exports = jade2pug;
