'use strict';
var path = require('path');
var fs = require('fs');

var util = require('./w-util.js');
var wServer = require('./w-server');
var wProxy = require('./w-proxy');
var log = require('./w-log');
var vars = util.vars;

var
  wOptimize = function() {
    var iArgv = util.makeArray(arguments);
    var iEnv = util.envPrase(iArgv);

    new util.Promise(((next) => {
      log('start', 'server', 'server init...');
      log('msg', 'info', 'build server config start');
      wServer.buildConfig(iEnv.name, iEnv, (err, config) => { // 创建 server 端 config
        if (err) {
          log('msg', 'error', ['build server config error:', err]);
          return log('finish');
        }

        log('msg', 'success', 'build server config finished')
        next(config);
      });
    })).then((config, next) => { // 检测 localserver.root 是否存在
      log('msg', 'info', `check localserver.root exist: ${config.localserver.root}`);

      if (!config.localserver.root) {
        log('msg', 'error', 'config.localserver.root is null! please check');
        return log('finish');
      } else {
        if (!fs.existsSync(config.alias.destRoot)) {
          util.mkdirSync(config.alias.destRoot);
          log('msg', 'create', config.alias.destRoot);
        }

        next(config);
      }
    }).then((config, next) => { // server init
      log('msg', 'info', 'server init start');
      wServer.init(config.workflow, (err) => {
        if (err) {
          log('msg', 'error', ['server init error', err]);
          return log('finish');
        }

        log('msg', 'success', 'server init finished');
        next(config);
      });
    }).then((config, next) => { // 代理服务初始化
      if (iEnv.proxy && config.proxy) {
        var iProxyConfig = util.extend(true, config.proxy);
        if (config.commit.hostname) {
          if (!iProxyConfig.localRemote) {
            iProxyConfig.localRemote = {};
          }
          var key = config.commit.hostname.replace(/[\\/]$/, '');

          // 处理 hostname 中 不带 协议的情况
          if (/^[/]{2}\w/.test(key)) {
            key = `http:${  key}`;
          }

          var val = util.joinFormat(`http://127.0.0.1:${  config.localserver.port}`);
          iProxyConfig.localRemote[key] = val;
        }

        log('msg', 'info', 'proxy init start');
        wProxy.init(iProxyConfig, (err) => {
          if (err) {
            log('msg', 'warn', `proxy init error: ${err.message}`);
          }
          log('msg', 'success', 'proxy init finished');
          next(config);
        }, iEnv.logLevel > 1);
      } else {
        log('msg', 'success', 'no proxy, next');
        next(config);
      }
    }).then((config, next) => { // 清除 localserver 目录下原有文件
      if (fs.existsSync(config.localserver.root)) {
        log('msg', 'info', `clean Path start: ${config.localserver.root}`);
        util.removeFiles(config.localserver.root, () => {
          log('msg', 'success', `clean path finished: ${config.localserver.root}`);
          next(config);
        });
      } else {
        next(config);
      }
    }).then((config, next) => { // localserver
      if (/watch/.test(iArgv[0])) {
        log('msg', 'info', 'local server init start');
        wServer.start(config.localserver.root, config.localserver.port, true, (err) => {
          if (err) {
            log('msg', 'error', ['local server init failed', err]);
          } else {
            log('msg', 'success', 'local server init finished');
          }
          next(config);
        });
      }
    }).then((config) => { // 运行命令
      log('msg', 'info', 'run cmd start');

      var workFlowPath = path.join(vars.SERVER_WORKFLOW_PATH, config.workflow);
      var gulpHand = util.joinFormat(
        workFlowPath,
        'node_modules',
        '.bin',
        util.vars.IS_WINDOWS? 'gulp.cmd': 'gulp'
      );

      var cmd = `${gulpHand} ${iArgv.join(' ')}`;

      log('msg', 'info', `run cmd: ${cmd}`);
      log('finish');
      util.runSpawn(cmd, (err) => {
        if (err) {
          return util.msg.error(iArgv[0], 'task run error', err);
        }
        if (global.YYL_RUN_CALLBACK) { // yyl.run 用 callback
          setTimeout(global.YYL_RUN_CALLBACK, 0);
        }
      }, workFlowPath);
    }).start();
  };


module.exports = wOptimize;

