'use strict';
const fs = require('fs');
const chalk = require('chalk');

const util = require('./w-util');

const info = {
  printInformation: function(config, silent) {
    var r = {
      'name': config.name,
      'workflow': config.workflow,
      'build-version': config.version,
      'platform': config.platform,
      'proxy': (function() {
        if (config.proxy) {
          var keys = Object.keys(config.proxy.localRemote);
          if (keys.length) {
            return keys.join(',');
          } else {
            return '';
          }
        } else {
          return '';
        }
      })()

    };

    var maxLen = 0;
    var maxLine = 0;

    Object.keys(r).forEach((key) => {
      if (key.length > maxLen) {
        maxLen = key.length;
      }
    });

    var printStr = (function() {
      var str = [];
      Object.keys(r).forEach((key) => {
        var blanks = new Array(maxLen - key.length + 1).join(' ');
        var s = ` ${chalk.green(key)}${blanks} ${r[key]}`;
        if (s.length > maxLine) {
          maxLine = s.length;
        }

        str.push(s);
      });

      return str.join('\n');
    })();

    var lineStr = ` ${  new Array(maxLine - 10).join('-')}`;

    if (!silent) {
      console.log([
        '',
        chalk.yellow(' # workflow info'),
        lineStr,
        printStr,
        lineStr,
        ''
      ].join('\n'));
    }
    return r;
  },
  init: function(silent) {
    var configPath = util.path.join(util.vars.PROJECT_PATH, 'config.js');
    var configMinePath = util.path.join(util.vars.PROJECT_PATH, 'config.mine.js');
    var config;
    var configMine;

    if (!fs.existsSync(configPath)) {
      util.msg.warn('read workflow info error, config.js is not exists');
      return Promise.resolve(null);
    }

    config = util.requireJs(configPath);

    if (!configPath) {
      util.msg.warn('read workflow info error, config.js parse error');
      return Promise.resolve(null);
    }

    if (fs.existsSync(configMinePath)) {
      configMine = util.requireJs(configMinePath);
      if (!configMine) {
        util.msg.warn('config.mine.js parse error');
      } else {
        config = util.extend(true, config, configMine);
      }
    }

    var isWork = false;
    let r;

    if ('workflow' in config) {
      r = info.printInformation(config, silent);
      isWork = true;
    } else {
      Object.keys(config).forEach((key) => {
        if ('workflow' in config[key]) {
          r = info.printInformation(config[key], silent);
          isWork = true;
        }
      });
    }

    if (!isWork) {
      util.msg.warn('read workflow info error, config seetting wrong');
      return Promise.resolve(null);
    } else {
      return Promise.resolve(r);
    }
  },
  run: function() {
    var iEnv = util.envPrase(arguments);
    return info.init(iEnv.silent);
  }
};

module.exports = info;
