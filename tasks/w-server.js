'use strict';
const tinylr = require('tiny-lr');
const fs = require('fs');
const path = require('path');
const url = require('url');
const http = require('http');
const chalk = require('chalk');
const extFs = require('yyl-fs');
const extOs = require('yyl-os');
const util = require('yyl-util');
const print = require('yyl-print');

const connect = require('connect');
const serveIndex = require('serve-index');
const serveStatic = require('serve-static');
const serveFavicon = require('serve-favicon');
const livereload = require('connect-livereload');

const extFn = require('../lib/extFn.js');
const vars = require('../lib/vars.js');
const log = require('../lib/log.js');

const wProfile = require('./w-profile.js');
const wProxy = require('./w-proxy.js');
const wMock = require('./w-mock.js');

require('http-shutdown').extend();

const cache = {
  lrServer: null,
  server: null,
  reject: null
};

const wServer = (ctx, iEnv, configPath) => {
  const she = wServer;
  switch (ctx) {
    case '--path':
    case '-p':
      return she.path(iEnv);

    case 'start':
      return (async () => {
        let config;
        config = await she.start(configPath, iEnv);
        config = await wProxy.start(config, iEnv);

        if (!iEnv.silent && config) {
          let serverPath = '';
          if (config.proxy && config.proxy.homePage) {
            serverPath = config.proxy.homePage;
          } else if (config.localserver && config.localserver.serverAddress) {
            serverPath = config.localserver.serverAddress;
          }
          if (serverPath) {
            extOs.openBrowser(serverPath);
            log('msg', 'success', `go to page     : ${chalk.yellow.bold(serverPath)}`);
          }
        }
        return config;
      })();

    case 'abort':
      return she.abort(iEnv);

    case 'clear':
    case 'clean':
      return she.clear();

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
      '--help': 'print usage information',
      '-p, --path': 'show the yyl server local path'
    }
  };
  if (!iEnv.silent) {
    print.help(h);
  }
  return Promise.resolve(h);
};

// 路径
wServer.path = (iEnv) => {
  if (!iEnv.silent) {
    log('msg', 'success', `path: ${chalk.yellow.bold(vars.SERVER_PATH)}`);
    extOs.openPath(vars.SERVER_PATH);
  }
  return Promise.resolve(vars.SERVER_PATH);
};

// 启动服务器
wServer.start = async function (ctx, iEnv, options) {
  const DEFAULT_CONFIG = {
    port: 5000,
    root: vars.PROJECT_PATH,
    lrPort: 50001
  };

  const op = options || {};

  // init config
  let config;
  let serverConfig;
  if (typeof ctx === 'object') {
    config = ctx;
    config.localserver = util.extend(DEFAULT_CONFIG, config.localserver);
    serverConfig = config.localserver;
  } else {
    try {
      config = await extFn.parseConfig(ctx, iEnv, ['localserver', 'proxy', 'commit']);
      if (config && config.localserver) {
        serverConfig = util.extend(DEFAULT_CONFIG, config.localserver);
      }
    } catch (er) {
      config = {};
      serverConfig = DEFAULT_CONFIG;
      log('msg', 'warn', er);
      log('msg', 'warn', 'use default server config');
    }
  }

  if (iEnv.path) {
    serverConfig.root = path.resolve(vars.PROJECT_PATH, iEnv.path);
  } else {
    serverConfig.root = path.resolve(config.alias.dirname, serverConfig.root);
  }
  if (iEnv.port) {
    serverConfig.port = iEnv.port;
  }

  serverConfig.serverAddress = `http://${vars.LOCAL_SERVER}:${serverConfig.port}`;

  // check port usage
  const portCanUse = await extOs.checkPort(serverConfig.port);
  if (portCanUse) {
    if (!fs.existsSync(serverConfig.root)) {
      extFs.mkdirSync(serverConfig.root);
    }
  } else {
    throw `port ${chalk.yellow(serverConfig.port)} was occupied, please check`;
  }

  log('msg', 'success', `server path    : ${chalk.yellow.bold(serverConfig.root)}`);
  log('msg', 'success', `server address : ${chalk.yellow.bold(serverConfig.serverAddress)}`);

  // livereload
  let lrServer;
  const app = connect();

  if (op.livereload) {
    if (iEnv.lrPort) {
      serverConfig.lrPort = iEnv.lrPort;
    } else {
      serverConfig.lrPort = `${serverConfig.port}1`;
    }
    const lrPortCanUse = await extOs.checkPort(serverConfig.lrPort);
    if (!lrPortCanUse) {
      throw `port ${chalk.yellow(serverConfig.lrPort)} was occupied, please check`;
    }
    log('msg', 'success', `server lr port : ${chalk.yellow.bold(serverConfig.lrPort)}`);

    lrServer = tinylr();
    app.use(livereload({
      port: serverConfig.lrPort,
      src: `//${vars.LOCAL_SERVER}:${serverConfig.lrPort}/livereload.js?snipver=1`
    }));
  }

  // mock
  app.use(wMock({
    dbPath: path.join(vars.PROJECT_PATH, 'mock/db.json'),
    routesPath: path.join(vars.PROJECT_PATH, 'mock/routes.json')
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

  // favicon
  app.use(serveFavicon(path.join(__dirname, '../resource/favicon.ico')));

  app.use(serveStatic(serverConfig.root, {
    'setHeaders': function(res, iPath) {
      if (path.extname(iPath) === '.tpl') {
        res.setHeader('Content-Type', 'text/html; charset=UTF-8');
      }
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Expires', 0);
      res.setHeader('Pragma', 'no-cache');
    }
  }));

  app.use(serveIndex(serverConfig.root));


  if (typeof op.onInitMiddleWare === 'function') {
    await op.onInitMiddleWare(app, serverConfig.port);
  }

  const server = http.createServer(app).withShutdown();

  server.on('error', (err) => {
    log('msg', 'error', err);
    throw err;
  });

  config.localserver = await util.makeAwait((next, reject) => {
    server.listen(serverConfig.port, (err) => {
      if (err) {
        return reject(err);
      }
      if (lrServer) {
        lrServer.listen(serverConfig.lrPort);
      }
      next(serverConfig);
    });
  });

  cache.server = server;
  cache.lrServer = lrServer;

  return config;
};

wServer.abort = async function() {
  if (cache.server) {
    await util.makeAwait((next) => {
      cache.server.shutdown(() => {
        cache.server = null;
        next();
      });
    });
  }

  if (cache.lrServer) {
    cache.lrServer.close();
    cache.lrServer = null;
  }

  await wProxy.abort();
};

wServer.clear = async function() {
  log('clear');
  log('start', 'server', 'clear server start...');
  const list = await extFs.removeFiles(vars.SERVER_PATH);
  list.forEach((iPath) => {
    log('msg', 'del', iPath);
  });
  await wProxy.clean();
  log('finish', 'clear finished');
};

wServer.setLogLevel = function(level, notSave, silent) {
  if (!notSave) {
    wProfile('logLevel', level);
  }
  log.update(level);
  if (!silent) {
    log('msg', 'success', `change logLevel: ${chalk.yellow.bold(level)}`);
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
