'use strict';
const chalk = require('chalk');

const log = require('../lib/log.js');
const extFn = require('../lib/extFn.js');

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
  async init(iEnv, configPath) {
    const config = await extFn.parseConfig(configPath, iEnv);
    let r = null;
    let isWork = false;

    if ('workflow' in config) {
      r = info.printInformation(config, iEnv.silent);
      isWork = true;
    } else {
      Object.keys(config).forEach((key) => {
        if ('workflow' in config[key]) {
          r = info.printInformation(config[key], iEnv.silent);
          isWork = true;
        }
      });
    }

    if (!isWork) {
      log('msg', 'warn', 'read workflow info error, config seetting wrong');
      return null;
    } else {
      return r;
    }
  },
  async run(iEnv, configPath) {
    return await info.init(iEnv, configPath);
  }
};

module.exports = info;
