'use strict';
const tinylr = require('tiny-lr');
const fs = require('fs');
const path = require('path');
const url = require('url');
const http = require('http');

const util = require('./w-util.js');
const color = require('yyl-color');
const connect = require('connect');
const serveIndex = require('serve-index');
const serveStatic = require('serve-static');
const livereload = require('connect-livereload');
const wRemove = require('./w-remove.js');
const wProxy = require('./w-proxy.js');
const log = require('./w-log');

const cache = {
  lrServer: null,
  server: null
};

const events = {
  help: function() {
    const iEnv = util.envPrase(arguments);
    const h = {
      usage: 'yyl server',
      commands: {
        'start': 'start local server',
        'init': 'init server ref',
        'clear': 'empty the server path'
      },
      options: {
        '--proxy': 'start with proxy server',
        '-h, --help': 'print usage information',
        '-p, --path': 'show the yyl server local path'
      }
    };
    if (!iEnv.silent) {
      util.help(h);
    }
    return Promise.resolve(h);
  },
  path: function() {
    const iEnv = util.envPrase(arguments);
    if (!iEnv.silent) {
      console.log([
        '',
        'yyl server path:',
        color.yellow(util.vars.SERVER_PATH),
        ''
      ].join('\n'));
      util.openPath(util.vars.SERVER_PATH);
    }

    return Promise.resolve(util.vars.SERVER_PATH);
  },

  start: function() {
    const iEnv = util.envPrase(arguments);
    const runner = (done) => {
      log('clear');
      const r = {
        localserver: false,
        proxy: false
      };

      new util.Promise((next) => {
        log('start', 'server', 'local server init...');
        const configPath = util.path.join(util.vars.PROJECT_PATH, 'config.js');
        if (fs.existsSync(configPath)) {
          const config = util.requireJs(configPath);
          if (config) {
            log('msg', 'info', 'use local config setting');
            wServer.buildConfig(iEnv.name, iEnv).then((iConfig) => {
              next(iConfig);
            }).catch((err) => {
              log('msg', 'error', err);
              next(null);
            });
          } else {
            log('msg', 'info', 'local config parse fail, not to use');
            next(null);
          }
        } else {
          log('msg', 'info', 'local config is not exist, not to use');
          next(null);
        }
      }).then((config, next) => {
        let setting = {
          port: 5000,
          root: util.vars.PROJECT_PATH
        };
        if (config && config.localserver) {
          setting = util.extend(setting, config.localserver);
        }

        if (iEnv.path) {
          setting.root = iEnv.path;
        }
        if (iEnv.port) {
          setting.port = iEnv.port;
        }
        util.checkPortUseage(setting.port, (canUse) => {
          if (canUse) {
            if (!fs.existsSync(setting.root)) {
              util.mkdirSync(setting.root);
            }
            wServer.start(setting.root, setting.port, iEnv.silent).then(() => {
              r.localserver = setting;
              log('finish', 'local server init finished');
              next(config);
            }).catch((er) => {
              r.localserver = false;
              log('msg', 'error', er);
              log('finish');
              throw new Error(er);
            });
          } else {
            r.localserver = false;
            log('msg', 'error', `port ${setting.port} is occupied, please check`);
            log('finish', 'local server init finished');
            next(config);
          }
        });
      }).then((config) => {
        let setting = {
          port: 8887,
          localRemote: {}
        };
        if (config && config.proxy) {
          setting = util.extend(true, setting, config.proxy);
        } else if (iEnv.proxy) {
          setting.port = iEnv.proxy;
        }

        if (setting.port) {
          log('start', 'proxy', 'proxy server init...');

          if (config && config.commit.hostname) {
            if (!setting.localRemote) {
              setting.localRemote = {};
            }
            var key = config.commit.hostname.replace(/[\\/]$/, '');

            // 处理 hostname 中 不带 协议的情况
            if (/^[/]{2}\w/.test(key)) {
              key = `http:${key}`;
            }

            var val = util.joinFormat(`http://127.0.0.1:${config.localserver.port}`);
            setting.localRemote[key] = val;
          }

          util.checkPortUseage(setting.port, (canUse) => {
            if (canUse) {
              wProxy.init(setting, () => {
                r.proxy = setting;
                log('finish', 'proxy server init finished');
                done(r);
              });
            } else {
              r.proxy = false;
              log('msg', 'error', `port ${setting.port} is occupied, please check`);
              log('finish', 'proxy server init finished');
              done(r);
            }
          });
        } else {
          r.proxy = false;
          log('msg', 'warn', 'proxy port is not set');
          done(r);
        }
      }).start();
    };

    return new Promise((next) => {
      runner(next);
    });
  },

  init: function(workflowName) {
    if (/^--/.test(workflowName)) {
      workflowName = '';
    }
    return wServer.init(workflowName, true);
  },

  // 服务器清空
  clear: function(workflow) {
    const runner = (done) => {
      new util.Promise(((next) => { // clear data file
        log('msg', 'info', `start clear server data path: ${util.vars.SERVER_DATA_PATH}`);
        if (fs.existsSync(util.vars.SERVER_DATA_PATH)) {
          util.removeFiles(util.vars.SERVER_DATA_PATH, () => {
            log('msg', 'success', 'clear server data path finished');
            next();
          });
        } else {
          log('msg', 'success', 'clear server data path finished');
          next();
        }
      })).then((NEXT) => { // clear workflowFile
        log('msg', 'info', `clear server workflow path start: ${util.vars.INIT_FILE_PATH}`);
        if (fs.existsSync(util.vars.INIT_FILE_PATH)) {
          const iPromise = new util.Promise();
          let dirs = fs.readdirSync(util.vars.INIT_FILE_PATH);
          if (workflow && ~dirs.indexOf(workflow)) {
            dirs = [workflow];
          }

          dirs.forEach((str) => {
            const nodeModulePath = util.joinFormat(util.vars.INIT_FILE_PATH, str, 'node_modules');

            if (fs.existsSync(nodeModulePath)) {
              iPromise.then((next) => {
                wRemove(nodeModulePath).then(() => {
                  next();
                }).catch((er) => {
                  log('msg', 'error', er);
                  next();
                });
              });
            }
          });

          iPromise.then(() => {
            NEXT();
          });
          iPromise.start();
        } else {
          NEXT();
        }
      }).then((next) => {
        log('msg', 'info', `start clear server path: ${util.vars.SERVER_PATH}`);
        wRemove(util.vars.SERVER_PATH).then(() => {
          log('msg', 'success', 'clear server path finished');
          next();
        }).catch((er) => {
          log('msg', 'error', er);
          next();
        });
      }).then(() => {
        log('msg', 'success', 'clear task finished');
        return done();
      }).start();
    };
    return new Promise((next) => {
      runner(next);
    });
  },
  abort: function() {
    return wServer.abort();
  }
};

const wServer = {
  clear: function(workflow) {
    return events.clear(workflow);
  },
  // 获取
  profile: function(key, val) {
    var iPath = util.joinFormat(util.vars.SERVER_DATA_PATH, 'profile.js');
    var data = {};

    if (util.type(key) == 'object') {
      util.mkdirSync(path.dirname(iPath));
      fs.writeFileSync(iPath, JSON.stringify(data, null, 4));
      return data;
    }

    if (fs.existsSync(iPath)) {
      try {
        data = JSON.parse(fs.readFileSync(iPath, 'utf8'));
      } catch (er) {}
    }


    if (key === undefined && val === undefined) {
      return data;
    }

    if (!key) {
      return;
    }

    if (val !== undefined) { //set
      util.mkdirSync(path.dirname(iPath));
      data[key] = val;
      fs.writeFileSync(iPath, JSON.stringify(data, null, 4));
      return val;
    } else { // get
      return data[key];
    }
  },

  // 构建 服务端 config
  buildConfig: function(name, env) {
    const runner = (done) => {
      var configPath = path.join(util.vars.PROJECT_PATH, 'config.js');
      var mineConfigPath;
      var config;
      var mineConfig;

      // 自定义 --config
      if (env.config) {
        if (path.isAbsolute(env.config)) {
          configPath = env.config;
        } else {
          configPath = path.join(util.vars.PROJECT_PATH, env.config);
        }
      }
      mineConfigPath = configPath.replace(/\.js$/, '.mine.js');

      // 获取 config, config.mine 文件内容
      if (!fs.existsSync(configPath)) {
        log('finish');
        throw new Error(`config.js not found: ${configPath}`);
      }

      if (fs.existsSync(mineConfigPath)) {
        try {
          mineConfig = util.requireJs(mineConfigPath);
        } catch (er) {}
      }
      if (fs.existsSync(configPath)) {
        try {
          config = util.requireJs(configPath);
        } catch (er) {
          throw new Error(`read config.js with error: ${er.message}`);
        }
      }

      if (!config) {
        throw new Error('nothing in config.js');
      }

      config = util.extend(true, config, mineConfig);

      var iWorkFlows = fs.readdirSync(path.join(util.vars.BASE_PATH, 'init-files'));
      var workFlowPath;
      var nameList = (function() {
        var r = [];
        if (config.workflow) {
          return r;
        }

        for (var key in config) {
          if (config.hasOwnProperty(key)) {
            if ('workflow' in config[key]) {
              r.push(key);
            }
          }
        }
        return r;
      })();

      if (name) {
        if (!config[name] ||
          !config[name].workflow ||
          !~iWorkFlows.indexOf(config[name].workflow)
        ) {
          if (nameList.length) {
            throw new Error(`you need to use --name ${nameList.join(' or ')}`);
          } else {
            throw new Error(`config[${name}].workflow is not exist`);
          }
        }

        workFlowPath = path.join(util.vars.SERVER_WORKFLOW_PATH, config[name].workflow);
      } else {
        if (!config.workflow || !~iWorkFlows.indexOf(config.workflow)) {
          if (nameList.length) {
            throw new Error(`add env: --name ${nameList.join('|')}`);
          } else {
            throw new Error('config.workflow is not exist');
          }
        }

        workFlowPath = path.join(util.vars.SERVER_WORKFLOW_PATH, config.workflow);
      }


      var pathTrans = function(iPath) {
        if (path.isAbsolute(iPath)) {
          return iPath;
        } else {
          if (util.vars.PROJECT_PATH.substr(0, 3) != workFlowPath.substr(0, 3)) { // 不同盘
            return util.joinFormat(util.vars.PROJECT_PATH, iPath);
          } else {
            return util.joinFormat(
              workFlowPath,
              path.relative(
                workFlowPath,
                path.join(util.vars.PROJECT_PATH, iPath)
              )
            );
          }
        }
      };
      var relateHere = function(obj, changeKey) {
        var iSrc;
        for (var key in obj) {
          switch (util.type(obj[key])) {
            case 'string':
              if (changeKey) {
                iSrc = pathTrans(key);
                obj[iSrc] = pathTrans(obj[key]);
                if (iSrc != key) {
                  delete obj[key];
                }
              } else {
                obj[key] = pathTrans(obj[key]);
              }
              break;

            default:
              break;
          }
        }
        return obj;
      };


      // 路径替换
      (function deep(obj) {
        for (var key in obj) {
          if (obj.hasOwnProperty(key)) {
            switch (util.type(obj[key])) {
              case 'object':
                if (key == 'alias') { // 替换 val
                  obj[key] = relateHere(obj[key]);
                } else if (key == 'resource') {
                  obj[key] = relateHere(obj[key], true);
                } else {
                  deep(obj[key]);
                }
                break;
              case 'string':
                break;

              default:
                break;
            }
          }
        }
      })(config);


      new util.Promise(((next) => {
        if (name) {
          next(config[name]);
        } else {
          next(config);
        }
      })).then((iConfig, next) => { // 自定义 config
        if (typeof iConfig.onInitConfig == 'function') {
          log('msg', 'info', 'run config.onInitConfig function');
          iConfig.onInitConfig(iConfig, env, next);
        } else {
          next(iConfig);
        }
      }).then((iConfig, next) => { // 更新 config 文件
        if (name) {
          config[name] = iConfig;
        } else {
          config = iConfig;
        }

        var fileStr = `module.exports=${JSON.stringify(config, null, 4)}`;

        util.mkdirSync(workFlowPath);
        fs.writeFileSync(path.join(workFlowPath, 'config.js'), fileStr);
        next(iConfig);
      }).then((iConfig, next) => { // 更新 config 内 插件
        if (iConfig.plugins && iConfig.plugins.length) {
          var iPkgPath = path.join(util.vars.INIT_FILE_PATH, iConfig.workflow, 'package.json');
          var installLists = [];

          iConfig.plugins.forEach((str) => {
            var iDir;
            var iVer;
            if (~str.indexOf('@')) {
              iDir = str.split('@')[0];
              iVer = str.split('@')[1];
            } else {
              iDir = str;
            }
            var iPath = path.join(workFlowPath, 'node_modules', iDir);
            var iPkgPath = path.join(iPath, 'package.json');
            var iPkg;
            if (fs.existsSync(iPath) && fs.existsSync(iPkgPath)) {
              if (iVer) {
                iPkg = require(iPkgPath);
                if (iPkg.version != iVer) {
                  installLists.push(str);
                }
              }
            } else {
              installLists.push(str);
            }
          });

          if (installLists.length) {
            if (!fs.existsSync(iPkgPath)) {
              fs.writeFileSync(iPkgPath, '{}');
            }

            var cmd = `npm install ${installLists.join(' ')}`;
            log('msg', 'info' `run cmd ${cmd}`);
            process.chdir(workFlowPath);

            log('end');
            util.runCMD(cmd, (err) => {
              if (err) {
                throw new Error(err);
              }

              next(iConfig);
            }, path.join(util.vars.INIT_FILE_PATH, iConfig.workflow));
          } else {
            next(iConfig);
          }
        } else {
          next(iConfig);
        }
      }).then((iConfig, next) => {
        done(iConfig);
        next();
      }).start();
    };

    return new Promise((next) => {
      runner(next);
    });
  },
  abort: function() {
    const runner = (done) => {
      new util.Promise((next) => {
        if (cache.server) {
          cache.server.close(() => {
            cache.server = null;
            next();
          });
        } else {
          next();
        }
      }).then((next) => {
        if (cache.lrServer) {
          cache.lrServer.close();
          cache.lrServer = null;
          next();
        } else {
          next();
        }
      }).then(() => {
        wProxy.abort().then(() => {
          done();
        });
      }).start();
    };
    return new Promise((next) => {
      runner(next);
    });
  },
  // 服务器启动
  start: function(iPath, port, silent) {
    iPath = path.resolve(util.vars.PROJECT_PATH, iPath);

    if (!iPath || !fs.existsSync(iPath)) {
      iPath = util.vars.PROJECT_PATH;
    }

    if (!port) {
      port = 5000;
    }
    var lrPort = 35729;

    var serverAddress = `http://${util.vars.LOCAL_SERVER}:${port}`;

    const runner = (done) => {
      new util.Promise((next) => {
        util.checkPortUseage(port, (canUse) => {
          if (!canUse) {
            const errMsg = `server port ${port} is be occupied, please check`;
            if (done) {
              done(errMsg);
            } else {
              log('msg', 'error', errMsg);
            }
          } else {
            next();
          }
        });
      }).then((next) => {
        util.checkPortUseage(lrPort, (canUse) => {
          if (!canUse) {
            const errMsg = `livereload port ${lrPort} is be occupied, please check`;
            if (done) {
              done(errMsg);
            } else {
              log('msg', 'error', errMsg);
            }
          } else {
            next();
          }
        });
      }).then(() => {
        log('msg', 'success', `local path : ${iPath}`);
        log('msg', 'success', `   address : ${serverAddress}`);
        log('msg', 'success', `   lr port : ${lrPort}`);

        var app = connect();
        app.use(livereload({
          port: lrPort,
          src: `http://localhost:${lrPort}/livereload.js?snipver=1`
        }));
        // 执行 post 请求本地服务器时处理
        app.use((req, res, next) => {
          if (req.method == 'POST') {
            var filePath = path.join(iPath, url.parse(req.url).pathname);

            if (fs.existsSync(filePath)) {
              res.write(fs.readFileSync(filePath));
            } else {
              res.statusCode = 404;
            }

            res.end();
          } else {
            next();
          }
        });
        app.use(serveStatic(iPath, {
          'setHeaders': function(res) {
            res.setHeader('Cache-Control', 'no-cache');
          }
        }));
        app.use(serveIndex(iPath));

        var server = http.createServer(app);
        var lrServer = tinylr();
        server.listen(port, (err) => {
          if (err) {
            log('msg', 'error', err);
            return done(err);
          }
          lrServer.listen(lrPort);
          if (!silent) {
            util.openBrowser(serverAddress);
          }
          if (done) {
            done();
          }
        });
        server.on('error', (err) => {
          log('msg', 'error', err);
          done(err);
        });

        cache.server = server;
        cache.lrServer = lrServer;
      }).start();
    };
    return new Promise((next) => {
      runner(next);
    });
  },
  setLogLevel: function(level, notSave) {
    if (!notSave) {
      wServer.profile('logLevel', level);
    }
    log.update(level);
    log('msg', 'success', `change logLevel: ${level}`);
  },
  getLogLevel: function() {
    const level = wServer.profile('logLevel');
    log('msg', 'info', `yyl logLevel: ${level}`);
  },
  // 服务器目录初始化
  init: function(workflowName, forceInstall) {
    const runner = (done) => {
      log('msg', 'info', `init server ${workflowName} start`);
      var workflows = [];
      if (!workflowName) {
        workflows = fs.readdirSync(path.join(util.vars.BASE_PATH, 'init-files'));
        // return done('workflow is empty');
      } else {
        workflows.push(workflowName);
      }

      var padding = workflows.length;
      var paddingCheck = function() {
        padding--;
        if (!padding) {
          if (done) {
            done();
          }
        }
      };

      workflows.forEach((workflowName) => {
        var workflowPath = path.join(util.vars.SERVER_WORKFLOW_PATH, workflowName);
        var workflowBasePath = path.join(util.vars.INIT_FILE_PATH, workflowName);
        let errMsg;

        if (!fs.existsSync(workflowBasePath)) {
          errMsg = `${workflowName} is not the right command`;
          log('msg', 'error', errMsg);
          throw new Error(errMsg);
        }

        new util.Promise((next) => { // server init
          util.mkdirSync(util.vars.SERVER_PATH);
          util.mkdirSync(workflowPath);
          next();
        }).then((next) => { // npm install
          wServer.updateNodeModules(workflowName, forceInstall).then(() => {
            log('msg', 'success', 'npm install finished');
            next();
          }).catch((er) => {
            log('msg', 'error', ['npm install fail on server!', er]);
          });
        }).then((next) => { // back to dirPath
          log('msg', 'success', `init server ${workflowName} finished`);
          paddingCheck();
          next();
        }).start();
      });
    };
    return new Promise((next) => {
      runner(next);
    });
  },

  updateNodeModules: function(workflow, forceInstall) {
    const workflowPath = util.path.join(util.vars.INIT_FILE_PATH, workflow);
    const pkgPath = util.path.join(workflowPath, 'package.json');
    const nodeModulePath = util.path.join(workflowPath, 'node_modules');

    return new Promise((next) => {
      if (!fs.existsSync(pkgPath)) {
        next();
      } else {
        let needRun = false;
        if (!fs.existsSync(nodeModulePath) || forceInstall) {
          needRun = true;
        } else {
          const pkg = util.requireJs(pkgPath);
          const iModule = util.extend({}, pkg.devDependencies, pkg.dependencies);
          Object.keys(iModule).some((key) => {
            const modulePath = util.path.join(nodeModulePath, key);
            if (fs.existsSync(modulePath)) {
              const modulePkgPath = util.path.join(modulePath, 'package.json');
              const iPkg = util.requireJs(modulePkgPath);

              if (util.compareVersion(iPkg.version, iModule[key]) < 0) {
                needRun = true;
                return true;
              }
            } else {
              needRun = true;
              return true;
            }
          });
        }
        if (needRun) {
          log('end');
          util.runCMD('npm install', (err) => {
            if (err) {
              throw new Error(err);
            }
            next();
          }, workflowPath);
        } else {
          next();
        }
      }
    });
  },

  // yyl 脚本调用 入口
  run: function() {
    var iArgv = util.makeArray(arguments);
    var ctx = iArgv[1];

    switch (ctx) {
      case '--path':
      case '-p':
        return events.path.apply(events, iArgv.slice(2));

      case 'start':
        return events.start.apply(events, iArgv.slice(2));

      case 'clear':
      case 'clean':
        return events.clear.apply(events, iArgv.slice(2));

      case 'init':
        return events.init.apply(events, iArgv.slice(2));

      case 'abort':
        return events.abort.apply(events, iArgv.slice(2));

      case '--h':
      case '--help':
        return events.help.apply(events, iArgv.slice(2));

      default:
        return events.help.apply(events, iArgv.slice(2));
    }
  }

};

module.exports = wServer;
