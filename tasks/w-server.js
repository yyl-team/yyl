'use strict';
const tinylr = require('tiny-lr');
const fs = require('fs');
const path = require('path');
const url = require('url');
const http = require('http');
const chalk = require('chalk');
const extFs = require('yyl-fs');

const wProfile = require('./w-profile.js');
const wOpzer = require('./w-optimize.js');
const util = require('./w-util.js');
const connect = require('connect');
const serveIndex = require('serve-index');
const serveStatic = require('serve-static');
const livereload = require('connect-livereload');
const wProxy = require('./w-proxy.js');
const wMock = require('./w-mock.js');
const log = require('./w-log');

const cache = {
  lrServer: null,
  server: null,
  reject: null
};

const fn = {
  exit(errMsg, reject) {
    log('msg', 'error', errMsg);
    log('finish');
    reject(errMsg);
  }
};

const wServer = (ctx, iEnv, configPath) => {
  const she = wServer;
  switch (ctx) {
    case '--path':
    case '-p':
      return she.path(iEnv);

    case 'start':
      return she.start(configPath, iEnv);

    case 'abort':
      return she.abort(iEnv);

    case 'clear':
    case 'clean':
      return she.clear();

    case '--h':
    case '--help':
      return she.help(iEnv);

    default:
      return she.help(iEnv);
  }
};

// 帮助
wServer.help = (iEnv) => {
  let h = {
    usage: 'yyl server',
    commands: {
      'start': 'start local server',
      'abort': 'abort local server',
      'clear': 'clear local yyl file'
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
};

// 路径
wServer.path = (iEnv) => {
  if (!iEnv.silent) {
    console.log(`
      yyl server path:
      ${chalk.yellow(util.vars.SERVER_PATH)}
    `);
    util.openPath(util.vars.SERVER_PATH);
  }
  return Promise.resolve(util.vars.SERVER_PATH);
};

// 启动服务器
wServer.start = (configPath, iEnv) => {
  const runner = (done, reject) => {
    log('clear');
    log('start', 'server', 'local server init...');


    new util.Promise((next) => {
      wOpzer.parseConfig(configPath, iEnv, ['localserver', 'proxy', 'commit']).then((config) => {
        log('msg', 'info', 'use local config setting');
        next(config);
      }).catch((er) => {
        log('msg', 'warn', `${er}, use default config setting`);
        next(null);
      });
    }).then((config, next) => { // setting init
      let setting = {
        proxy: {
          port: 8887,
          localRemote: {},
          ignores: []
        },
        server: {
          port: 5000,
          root: util.vars.PROJECT_PATH,
          lrPort: 50001
        }
      };
      if (config && config.localserver) {
        setting.server = util.extend(setting.server, config.localserver);
      }

      if (iEnv.path) {
        setting.server.root = path.resolve(util.vars.PROJECT_PATH, iEnv.path);
      }
      if (iEnv.port) {
        setting.server.port = iEnv.port;
      }

      if (iEnv.lrPort) {
        setting.server.lrPort = iEnv.lrPort;
      } else {
        setting.server.lrPort = `${setting.server.port}1`;
      }
      setting.server.serverAddress = `http://${util.vars.LOCAL_SERVER}:${setting.server.port}`;

      // proxy setting
      if (config && config.proxy) {
        setting.proxy = util.extend(true, setting.proxy, config.proxy);
      } else if (iEnv.proxy) {
        setting.proxy.port = iEnv.proxy;
      }

      if (config && config.commit.hostname) {
        if (!setting.proxy.localRemote) {
          setting.proxy.localRemote = {};
        }
        let key = config.commit.hostname.replace(/[\\/]$/, '');

        // 处理 hostname 中 不带 协议的情况
        if (/^[/]{2}\w/.test(key)) {
          key = `http:${key}`;
        }

        const val = util.joinFormat(`http://127.0.0.1:${config.localserver.port}`);
        setting.proxy.localRemote[key] = val;
      }

      next(setting);
    }).then((setting, next) => { // check local server port
      util.checkPortUseage(setting.server.port, (canUse) => {
        if (canUse) {
          if (!fs.existsSync(setting.server.root)) {
            extFs.mkdirSync(setting.server.root);
          }
          next(setting);
        } else {
          return fn.exit(`port ${chalk.yellow(setting.server.port)} is occupied, please check`, reject);
        }
      });
    }).then((setting, next) => { // check lrPort
      util.checkPortUseage(setting.server.lrPort, (canUse) => {
        if (canUse) {
          next(setting);
        } else {
          return fn.exit(`port ${chalk.yellow(setting.server.lrPort)} is occupied, please check`, reject);
        }
      });
    }).then((setting, next) => { // start local server
      log('msg', 'success', `server path    : ${chalk.yellow(setting.server.root)}`);
      log('msg', 'success', `server address : ${chalk.yellow(setting.server.serverAddress)}`);
      log('msg', 'success', `server lr port : ${chalk.yellow(setting.server.lrPort)}`);

      var app = connect();
      app.use(livereload({
        port: setting.server.lrPort,
        src: `http://localhost:${setting.server.lrPort}/livereload.js?snipver=1`
      }));

      // mock
      app.use(wMock({
        dbPath: path.join(util.vars.PROJECT_PATH, 'mock/db.json'),
        routesPath: path.join(util.vars.PROJECT_PATH, 'mock/routes.json')
      }));

      // 执行 post 请求本地服务器时处理
      app.use((req, res, next) => {
        if (req.method == 'POST') {
          var filePath = path.join(setting.server.root, url.parse(req.url).pathname);

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

      app.use(serveStatic(setting.server.root, {
        'setHeaders': function(res) {
          res.setHeader('Cache-Control', 'no-cache');
        }
      }));
      app.use(serveIndex(setting.server.root));

      var server = http.createServer(app);
      var lrServer = tinylr();
      server.listen(setting.server.port, (err) => {
        if (err) {
          log('msg', 'error', err);
          return fn.exit(err, reject);
        }
        lrServer.listen(setting.server.lrPort);
        if (!iEnv.silent) {
          if (setting.proxy.homePage) {
            util.openBrowser(setting.proxy.homePage);
          } else {
            util.openBrowser(setting.server.serverAddress);
          }
        }
        next(setting);
      });
      server.on('error', (err) => {
        log('msg', 'error', err);
        fn.exit(err, reject);
      });

      cache.server = server;
      cache.lrServer = lrServer;
    }).then((setting, next) => { // start proxy server
      util.checkPortUseage(setting.proxy.port, (canUse) => {
        if (canUse) {
          wProxy.init(setting.proxy, () => {
            log('msg', 'success', 'proxy server init finished');
            next(setting);
          });
        } else {
          log('msg', 'error', `port ${chalk.yellow(setting.port)} is occupied, please check`);
          next(setting);
        }
      });
    }).then((setting) => { // finished
      log('finish');
      done(setting);
    }).start();
  };

  return new Promise(runner);
};

wServer.abort = () => {
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
  return new Promise(runner);
};

wServer.clear = function() {
  return new Promise(() => {
    log('clear');
    log('start', 'server', 'clear server start...');

    extFs.removeFiles(util.vars.SERVER_PATH).then((list) => {
      list.forEach((iPath) => {
        log('msg', 'del', iPath);
      });
      log('finish', 'clear finished');
    });
  });
};

wServer.setLogLevel = function(level, notSave, silent) {
  if (!notSave) {
    wProfile('logLevel', level);
  }
  log.update(level);
  if (!silent) {
    log('msg', 'success', `change logLevel: ${level}`);
  }
  return Promise.resolve(level);
};
wServer.getLogLevel = function(silent) {
  const level = wProfile('logLevel') ||  1;
  log.update(+level);
  if (!silent) {
    console.log([
      '',
      ` ${chalk.yellow.bold('logLevel')}: ${chalk.yellow(level)}`,
      ''
    ].join('\n'));
  }
  return Promise.resolve(level);
};

module.exports = wServer;
