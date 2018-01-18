'use strict';
var path = require('path');
var fs = require('fs');

var util = require('./w-util.js');
var wServer = require('./w-server.js');

var jade2pug = {
  init: function(op) {
    new util.Promise(((next) => {
      util.msg.info('build server config start');
      wServer.buildConfig(op.name, op, (err, config) => { // 创建 server 端 config
        if (err) {
          return util.msg.error('build server config error:', err);
        }

        util.msg.success('build server config done');
        util.printIt.init(config);
        next(config);
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
        util.msg.del(util.printIt(iPath));
        util.msg.create(util.printIt(pugPath));
      });

      util.msg.success('yyl pug2dest finished');
    }).start();
  },
  // 获取所有 jade 文件
  run: function() {
    var iArgv = util.makeArray(arguments);
    var op = util.envParse(iArgv);

    jade2pug.init(op);
  }
};


module.exports = jade2pug;
