'use strict';
var util = require('./w-util');
var fs = require('fs');
var color = require('yyl-color');

var
  info = {
    printInformation: function(config) {
      var r = {
        'name': config.name,
        'workflow': config.workflow,
        'build-version': config.version,
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

      Object.keys(r).forEach(function(key) {
        if (key.length > maxLen) {
          maxLen = key.length;
        }
      });

      var printStr = (function() {
        var str = [];
        Object.keys(r).forEach(function(key) {
          var blanks = new Array(maxLen - key.length + 1).join(' ');
          var s = ' ' + color.green(key) + blanks + ' ' + r[key];
          if (s.length > maxLine) {
            maxLine = s.length;
          }

          str.push(s);
        });

        return str.join('\n');
      })();

      var lineStr = ' ' + new Array(maxLine - 10).join('-');

      console.log('');
      console.log(color.yellow(' # workflow info'));
      console.log(lineStr);
      console.log(printStr);
      console.log(lineStr);
      console.log('');
    },
    init: function() {
      var configPath = util.path.join(util.vars.PROJECT_PATH, 'config.js');
      var configMinePath = util.path.join(util.vars.PROJECT_PATH, 'config.mine.js');
      var config, configMine;

      if (!fs.existsSync(configPath)) {
        return util.msg.warn('read workflow info error, config.js is not exists');
      }

      config = util.requireJs(configPath);

      if (!configPath) {
        return util.msg.warn('read workflow info error, config.js parse error');
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

      if ('workflow' in config) {
        info.printInformation(config);
        isWork = true;
      } else {
        Object.keys(config).forEach(function(key) {
          if ('workflow' in config[key]) {
            info.printInformation(config[key]);
            isWork = true;
          }
        });
      }

      if (!isWork) {
        return util.msg.warn('read workflow info error, config seetting wrong');
      }
    },
    run: function() {
      info.init();
    }
  };

module.exports = info;
