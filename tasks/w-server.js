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
  },
  makeAwait(fn) {
    return new Promise(fn);
  }
};

const wServer = (ctx, iEnv, configPath) => {
  const she = wServer;
  switch (ctx) {
    case '--path':
    case '-p':
      return she.path(iEnv);

    case 'start':
      return async () => {
        log('clear');
        log('start', 'server', 'local server init...');
        try {
          const config = await she.start(configPath, iEnv);
          await wProxy.start(config, iEnv);
        } catch (er) {
          log('error', er);
        }
        log('finish');
      };

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
wServer.start = async function (ctx, iEnv) {
  // init config
  let config;
  if (typeof ctx === 'object') {
    config = ctx;
  } else {
    try {
      config = await wOpzer.parseConfig(ctx, iEnv, ['localserver', 'proxy', 'commit']);
    } catch (er) {
      config = null;
      log('msg', 'warn', `${er}, use default config setting`);
    }
  }
  const DEFAULT_CONFIG = {
    port: 5000,
    root: util.vars.PROJECT_PATH,
    lrPort: 50001
  }

  let serverConfig;
  if (config && config.localserver) {
    serverConfig = util.extend(DEFAULT_CONFIG, config.localserver);
    if (iEnv.path) {
      serverConfig.root = path.resolve(util.vars.PROJECT_PATH, iEnv.path);
    }
    if (iEnv.port) {
      serverConfig.port = iEnv.port;
    }

    if (iEnv.lrPort) {
      serverConfig.lrPort = iEnv.lrPort;
    } else {
      serverConfig.lrPort = `${serverConfig.port}1`;
    }
    serverConfig.serverAddress = `http://${util.vars.LOCAL_SERVER}:${serverConfig.port}`;
  }

  // check port usage
  const portCanUse = await fn.checkPortUseage(serverConfig.port);
  if (portCanUse) {
    if (!fs.existsSync(serverConfig.root)) {
      extFs.mkdirSync(serverConfig.root);
    }
  } else {
    throw `port ${chalk.yellow(serverConfig.port)} is occupied, please check`;
  }

  const lrPortCanUse = await fn.checkPortUseage(serverConfig.lrPort);
  if (!lrPortCanUse) {
    throw `port ${chalk.yellow(serverConfig.lrPort)} is occupied, please check`;
  }

  log('msg', 'success', `server path    : ${chalk.yellow(serverConfig.root)}`);
  log('msg', 'success', `server address : ${chalk.yellow(serverConfig.serverAddress)}`);
  log('msg', 'success', `server lr port : ${chalk.yellow(serverConfig.lrPort)}`);

  const app = connect();
  app.use(livereload({
    port: serverConfig.lrPort,
    src: `http://localhost:${serverConfig.lrPort}/livereload.js?snipver=1`
  }));

  // mock
  app.use(wMock({
    dbPath: path.join(util.vars.PROJECT_PATH, 'mock/db.json'),
    routesPath: path.join(util.vars.PROJECT_PATH, 'mock/routes.json')
  }));

  // 执行 post 请求本地服务器时处理
  app.use((req, res, next) => {
    if (req.method == 'POST') {
      var filePath = path.join(serverConfig.root, url.parse(req.url).pathname);
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

  app.use(serveStatic(serverConfig.root, {
    'setHeaders': function(res) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }));

  app.use(serveIndex(serverConfig.root));

  var server = http.createServer(app);
  var lrServer = tinylr();

  server.on('error', (err) => {
    log('msg', 'error', err);
    throw err;
  });


  config.localserver = await fn.makeAwait((next, reject) => {
    server.listen(serverConfig.port, (err) => {
      if (err) {
        return reject(err);
      }
      lrServer.listen(serverConfig.lrPort);
      next(serverConfig);
    });
  });

  cache.server = server;
  cache.lrServer = lrServer;

  return config;
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
