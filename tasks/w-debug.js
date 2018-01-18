'use strict';
var fs = require('fs');
var path = require('path');
var util = require('./w-util.js');


module.exports = function() {
  var pkgPath = path.join(util.vars.PROJECT_PATH, 'package.json');
  var pkg;

  if (fs.existsSync(pkgPath)) {
    pkg = require(pkgPath);

    if (pkg.name == 'yyl') {
      var cmd = 'npm link';
      util.runCMD(cmd, (err) => {
        if (err) {
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
