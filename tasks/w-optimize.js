'use strict';
var path = require('path');
var fs = require('fs');

var util = require('./w-util.js');
var wServer = require('./w-server');
var wProxy = require('./w-proxy');
var vars = util.vars;

var
  wOptimize = function() {
    var iArgv = util.makeArray(arguments);
    var iEnv = util.envPrase(iArgv);

    new util.Promise(((next) => {
      util.msg.info('build server config start');
      wServer.buildConfig(iEnv.name, iEnv, (err, config) => { // 创建 server 端 config
        if (err) {
          return util.msg.error('build server config error:', err);
        }

        util.msg.success('build server config done');
        next(config);
      });
    })).then((config, next) => { // 检测 localserver.root 是否存在
      util.msg.info('check localserver.root exist:', config.localserver.root);

      if (!config.localserver.root) {
        return util.msg.error('config.localserver.root is null! please check');
      } else {
        if (!fs.existsSync(config.alias.destRoot)) {
          util.mkdirSync(config.alias.destRoot);
          util.msg.create(config.alias.destRoot);
        }

        next(config);
      }
    }).then((config, next) => { // server init
      util.msg.info('server init start');
      wServer.init(config.workflow, (err) => {
        if (err) {
          return util.msg.error('server init error', err);
        }

        util.msg.success('server init done');
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

        wProxy.init(iProxyConfig, (err) => {
          if (err) {
            util.msg.warn('proxy init error', err);
          }
          next(config);
        }, iEnv.logLevel > 1);
      } else {
        util.msg.info('no proxy, next');
        next(config);
      }
    }).then((config, next) => { // 清除 localserver 目录下原有文件
      if (fs.existsSync(config.localserver.root)) {
        util.msg.info('clean Path start:', config.localserver.root);
        util.removeFiles(config.localserver.root, () => {
          util.msg.success('clean Path done:', config.localserver.root);
          next(config);
        });
      } else {
        next(config);
      }
    }).then((config) => { // 运行命令
      util.msg.info('run cmd start');

      var workFlowPath = path.join(vars.SERVER_WORKFLOW_PATH, config.workflow);
      // var cmd = 'gulp ' + iArgv.join(' ');
      // var cmd = util.joinFormat(workFlowPath, 'node_modules', '.bin', util.vars.IS_WINDOWS? 'gulp.cmd': 'gulp') + ' ' + iArgv.join(' ');
      var cmd = `gulp ${iArgv.join(' ')}`;

      if (/watch/.test(iArgv[0])) {
        wServer.start(config.localserver.root, config.localserver.port, true);
      }

      util.msg.info('run cmd:', cmd);
      util.runNodeModule(cmd, (err) => {
        if (err) {
          return util.msg.error(iArgv[0], 'task run error', err);
        }
        util.msg.success('run cmd done');
        if (global.YYL_RUN_CALLBACK) { // yyl.run 用 callback
          setTimeout(global.YYL_RUN_CALLBACK, 0);
        }
      }, {
        cwd: workFlowPath,
        nodeBinPath: util.joinFormat(workFlowPath, 'node_modules', '.bin')
      });
    }).start();
  };


module.exports = wOptimize;

