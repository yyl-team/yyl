'use strict';
var tinylr = require('tiny-lr');
var fs = require('fs');
var path = require('path');
var url = require('url');

var util = require('./w-util.js');
var color = require('yyl-color');
var vars = util.vars;
var connect = require('connect');
var serveIndex = require('serve-index');
var serveStatic = require('serve-static');
var livereload = require('connect-livereload');
var wRemove = require('./w-remove.js');
var wProxy = require('./w-proxy.js');

var cache = {};

var
  events = {
    help: function() {
      util.help({
        usage: 'yyl server',
        commands: {
          'start': 'start local server',
          'init': 'init server ref',
          'clear': 'empty the server path',
          'rebuild': 'reinstall the server node_modules'
        },
        options: {
          '--proxy': 'start with proxy server',
          '-h, --help': 'print usage information',
          '-p, --path': 'show the yyl server local path'
        }
      });
    },
    path: function() {
      console.log([
        '',
        'yyl server path:',
        color.yellow(vars.SERVER_PATH),
        ''
      ].join('\n'));

      util.openPath(vars.SERVER_PATH);
    },

    start: function() {
      var iEnv = util.envPrase(arguments);

      wServer.start(iEnv.path);
      if (iEnv.proxy) {
        wProxy.init({
          port: 8887
        }, !iEnv.silent);
      }
    },
    rebuild: function(name) {
      var type;
      var iWorkflows = util.readdirSync(path.join( util.vars.SERVER_WORKFLOW_PATH));
      if (name) {
        type = name;
      } else {
        if (fs.existsSync(util.vars.USER_CONFIG_FILE)) {
          var userConfig = util.requireJs(util.vars.USER_CONFIG_FILE);
          type = userConfig.workflow;
          if (!type) {
            Object.keys(userConfig).forEach((key) => {
              if (userConfig[key].workflow) {
                type = userConfig[key].workflow;
                return true;
              }
            });
          }
          if (!userConfig) {
            return util.msg.error('yyl rebuild fail', 'user config parse error');
          }
        } else {
          return util.msg.error('yyl rebuild fail', 'no user config file in current cwd');
        }
      }

      if (~iWorkflows.indexOf(type)) {
        var targetPath = path.join(util.vars.SERVER_WORKFLOW_PATH, type, 'node_modules');
        if (fs.existsSync(targetPath)) {
          util.msg.info('start remove server files:');
          util.msg.info(targetPath);
          util.removeFiles(targetPath, () => {
            util.msg.success('done');
            util.msg.info('start run npm install');
            util.runCMD('npm install', () => {
              util.msg.success('yyl rebuild success');
            }, path.join(targetPath, '../'));
          });
        } else {
          return util.msg.success('yyl rebuild success');
        }
      } else {
        return util.msg.warn('yyl rebuild success', type, 'is not in', iWorkflows.join('|'));
      }
    },
    init: function(workflowName) {
      wServer.init(workflowName, (err) => {
        if (err) {
          util.msg.error(err);
        }
      }, true);
    },

    // 服务器清空
    clear: function(done, silent) {
      util.msg.silent(silent);
      new util.Promise(((next) => { // clear data file
        util.msg.info('start clear server data path:', vars.SERVER_DATA_PATH);
        if (fs.existsSync(vars.SERVER_DATA_PATH)) {
          util.removeFiles(vars.SERVER_DATA_PATH, () => {
            util.msg.info('done');
            next();
          });
        } else {
          util.msg.info('done');
          next();
        }
      })).then((NEXT) => { // clear workflowFile
        util.msg.info('start clear server workflow path', vars.SERVER_WORKFLOW_PATH);
        if (fs.existsSync(vars.SERVER_WORKFLOW_PATH)) {
          var iPromise = new util.Promise();
          fs.readdirSync(vars.SERVER_WORKFLOW_PATH).forEach((str) => {
            var iPath = util.joinFormat(vars.SERVER_WORKFLOW_PATH, str);
            var nodeModulePath = util.joinFormat(iPath, 'node_modules');

            if (fs.existsSync(nodeModulePath)) {
              iPromise.then((next) => {
                wRemove(nodeModulePath, () => {
                  next();
                });
              });
            }

            iPromise.then((next) => {
              wRemove(iPath, () => {
                next();
              });
            });
          });

          iPromise.then(() => {
            NEXT();
          });
          iPromise.start();
        } else {
          NEXT();
        }
      }).then((next) => {
        util.msg.info('start clear server path', vars.SERVER_PATH);
        wRemove(vars.SERVER_PATH, () => {
          next();
        });
      }).then(() => {
        util.msg.success('clear task done');
        return done && done();
      }).start();
    }
  };

var
  wServer = {
    clear: function(done) {
      events.clear(done);
    },
    // 获取
    profile: function(key, val) {
      var iPath = util.joinFormat(vars.SERVER_DATA_PATH, 'profile.js');
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
    // // 构建 服务端 webpackconfig
    // buildWebpackConfig: function(workflowName, done){
    //     var
    //         webpackConfigPath = path.join(vars.PROJECT_PATH, 'webpack.config.js'),
    //         serverPath = path.join(vars.SERVER_WORKFLOW_PATH, workflowName);

    //     if(!fs.existsSync(serverPath)){
    //         return done('serverPath not exist, break', serverPath);
    //     }

    //     if(!fs.existsSync(webpackConfigPath)){
    //         return done('no webpack.config.js, break', webpackConfigPath);
    //     }



    // },
    // 构建 服务端 config
    buildConfig: function(name, env, done) {
      var configPath = path.join(vars.PROJECT_PATH, 'config.js');
      var mineConfigPath = path.join(vars.PROJECT_PATH, 'config.mine.js');
      var config;
      var mineConfig;

      // 获取 config, config.mine 文件内容
      if (!fs.existsSync(configPath)) {
        return done('config.js not found');
      }


      if (fs.existsSync(mineConfigPath)) {
        try {
          delete require.cache[mineConfigPath];
          mineConfig = util.requireJs(mineConfigPath);
        } catch (er) {}
      }
      if (fs.existsSync(configPath)) {
        delete require.cache[configPath];
        try {
          config = require(configPath);
        } catch (er) {
          return done(`read config.js with error: ${er.message}`);
        }
      }

      if (!config) {
        return done('nothing in config.js');
      }

      config = util.extend(true, config, mineConfig);

      var iWorkFlows = fs.readdirSync(path.join(vars.BASE_PATH, 'init-files'));
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
            return done(`you need to use --name ${  nameList.join(' or ')}`);
          } else {
            return done(`config[${ name }].workflow is not exist`);
          }
        }

        workFlowPath = path.join(vars.SERVER_WORKFLOW_PATH, config[name].workflow);
      } else {
        if (!config.workflow || !~iWorkFlows.indexOf(config.workflow)) {
          if (nameList.length) {
            return done(`add env: --name ${  nameList.join('|')}`);
          } else {
            return done('config.workflow is not exist');
          }
        }

        workFlowPath = path.join(vars.SERVER_WORKFLOW_PATH, config.workflow);
      }


      var pathTrans = function(iPath) {
        if (path.isAbsolute(iPath)) {
          return iPath;
        } else {
          if (vars.PROJECT_PATH.substr(0, 3) != workFlowPath.substr(0, 3)) { // 不同盘
            return util.joinFormat(vars.PROJECT_PATH, iPath);
          } else {
            return util.joinFormat(
              workFlowPath,
              path.relative(
                workFlowPath,
                path.join(vars.PROJECT_PATH, iPath)
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
        for ( var key in obj ) {
          if (obj.hasOwnProperty(key)) {
            switch (util.type(obj[key])) {
              case 'object':
                if (key == 'alias') { // 替换 val
                  obj[key] = relateHere(obj[key]);
                } else if (key  == 'resource') {
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
          util.msg.info('run config.onInitConfig function');
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

        var fileStr = `module.exports=${  JSON.stringify(config, null, 4)}`;

        util.mkdirSync(workFlowPath);
        fs.writeFileSync(path.join(workFlowPath, 'config.js'), fileStr);
        next(iConfig);
      }).then((iConfig, next) => { // 更新 config 内 插件
        if (iConfig.plugins && iConfig.plugins.length) {
          var iPkgPath = path.join(vars.SERVER_WORKFLOW_PATH, iConfig.workflow, 'package.json');
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


            var cmd = `npm install ${  installLists.join(' ')}`;
            util.msg.info('run cmd:', cmd);
            process.chdir(workFlowPath);

            util.runCMD(cmd, (err) => {
              if (err) {
                return done(err, iConfig);
              }
              process.chdir(vars.PROJECT_PATH);

              next(iConfig);
            }, path.join(vars.SERVER_WORKFLOW_PATH, iConfig.workflow));
          } else {
            next(iConfig);
          }
        } else {
          next(iConfig);
        }
      }).then((iConfig, next) => {
        done(null, iConfig);
        next();
      }).start();
    },
    abort: function(done) {
      if (cache.server) {
        cache.server.close(() => {
          return done && done();
        });
      }
    },
    // 服务器启动
    start: function(iPath, port, silent, done) {
      if (!iPath || !fs.existsSync(iPath)) {
        iPath = vars.PROJECT_PATH;
      }

      if (!port) {
        port = 5000;
      }
      var lrPort = 35729;

      var serverAddress = `http://${util.vars.LOCAL_SERVER}:${port}`;

      util.msg.info('local server start');
      util.msg.info('local path:', iPath);
      util.msg.info('livereload port:', lrPort);
      util.msg.info('address:', serverAddress);

      var server = connect()

        .use(livereload({
          port: lrPort,
          src: 'http://localhost:35729/livereload.js?snipver=1'
        }))

        // 执行 post 请求本地服务器时处理
        .use((req, res, next) => {
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
        })
        .use(serveStatic(iPath, {
          'setHeaders': function(res) {
            res.setHeader('Cache-Control', 'no-cache');
          }
        }))
        .use(serveIndex(iPath))


        .listen(port, (err) => {
          if (err) {
            util.msg.error(err);
            return done(err);
          }
          tinylr().listen(lrPort);
          if (!silent) {
            util.openBrowser(serverAddress);
          }
          if (done) {
            done();
          }
        });
      server.on('error', (err) => {
        if (err.code == 'EADDRINUSE') {
          util.msg.error('local server start fail:', port, 'is occupied, please check');
        } else {
          util.msg.error(err);
        }
        done(err);
      });

      cache.server = server;
    },
    // 服务器目录初始化
    init: function(workflowName, done, forceInstall) {
      util.msg.info('init server', workflowName, 'start');
      var workflows = [];
      if (!workflowName) {
        workflows = fs.readdirSync(path.join(vars.BASE_PATH, 'init-files'));
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
        var workflowPath = path.join(vars.SERVER_WORKFLOW_PATH, workflowName);
        var workflowBasePath = path.join(vars.BASE_PATH, 'init-files', workflowName);

        if (!fs.existsSync(workflowBasePath)) {
          return done(`${workflowName  } isnot the right command`);
        }

        new util.Promise(((next) => { // server init
          util.mkdirSync(vars.SERVER_PATH);
          util.mkdirSync(workflowPath);
          next();
        })).then((next) => { // copy files to server
          var files = [];
          var fileParam = {};

          switch (workflowName) {
            case 'gulp-requirejs':
            case 'rollup-babel':
              files = ['package.json', 'gulpfile.js'];
              break;


            case 'webpack-vue':
              files = ['package.json', 'gulpfile.js', 'webpack.config.js'];
              break;

            case 'webpack-vue2':
              files = ['package.json', 'gulpfile.js', 'webpack.config.js'];
              break;

            default:
              files = ['package.json', 'gulpfile.js'];
              break;
          }
          files.forEach((filePath) => {
            fileParam[path.join(vars.BASE_PATH, 'init-files', workflowName, filePath)] = path.join(workflowPath, filePath);
          });

          util.copyFiles(fileParam, (err) => {
            if (err) {
              util.msg.error('copy', workflowName, 'files to serverpath fail', err);
              return;
            }
            util.msg.success('copy', workflowName, 'files to serverpath success');
            next();
          });
        }).then((next) => { // npm install
          var nocmd = true;
          var modulePath = path.join(workflowPath, 'node_modules');

          if (!forceInstall) {
            if (!fs.existsSync(modulePath)) {
              nocmd = false;
            } else {
              var dirs = fs.readdirSync(modulePath);
              var pkg = util.requireJs(path.join(workflowPath, 'package.json'));
              var devs = pkg.devDependencies;
              var ds = pkg.dependencies;
              var checkDev = function(devs) {
                var modulePkgPath;
                var modulePkg;
                var moduleVer;
                var key;

                for (key in devs) {
                  if (devs.hasOwnProperty(key)) {
                    if (!~dirs.indexOf(key)) {
                      nocmd = false;
                      break;
                    } else {
                      modulePkgPath = path.join(modulePath, key, 'package.json');

                      if (fs.existsSync(modulePkgPath)) {
                        modulePkg = util.requireJs(modulePkgPath);
                        moduleVer = modulePkg.version;
                        if (util.compareVersion(devs[key], moduleVer) > 0) {
                          nocmd = false;
                          break;
                        }
                      }
                    }
                  }
                }
              };

              if (nocmd) {
                checkDev(devs);
              }

              if (nocmd) {
                checkDev(ds);
              }
            }
          }


          if (nocmd && !forceInstall) {
            next();
          } else {
            if (fs.existsSync(path.join(workflowPath, 'package.json'))) {
              process.chdir(workflowPath);
              util.runCMD('npm install', (err) => {
                if (err) {
                  util.msg.error('npm install fail on server!');
                  return;
                }
                util.msg.success('npm install success');
                process.chdir(vars.PROJECT_PATH);
                next();
              }, workflowPath);
            } else {
              util.msg.warn('package.json not exist, continue:', workflowPath);
              next();
            }
          }
        }).then((next) => { // back to dirPath
          util.msg.success('init server', workflowName, 'success');
          paddingCheck();
          next();
        }).start();
      });
    },

    // yyl 脚本调用 入口
    run: function() {
      var iArgv = util.makeArray(arguments);
      var ctx = iArgv[1];

      switch (ctx) {
        case '--path':
        case '-p':
          events.path();
          break;

        case 'start':
          events.start.apply(events, iArgv.slice(2));
          break;

        case 'clear':
        case 'clean':
          events.clear();
          break;

        case 'init':
          events.init.apply(events, iArgv.slice(2));
          break;

        case 'rebuild':
          events.rebuild.apply(events, iArgv.slice(2));
          break;

        case '--h':
        case '--help':
          events.help();
          break;

        default:
          events.help();
          break;
      }
    }

  };

module.exports = wServer;
