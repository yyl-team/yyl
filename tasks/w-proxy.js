'use strict';
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const extFs = require('yyl-fs');

const log = require('./w-log.js');
const util = require('./w-util.js');
const extFn = require('./w-extFn.js');

const AnyProxy = require('anyproxy');

const cache = {
  server: null,
  index: 0
};

const wProxy = (ctx, iEnv, configPath) => {
  const she = wProxy;
  switch (ctx) {
    case 'start':
      return (async () => {
        let config;
        try {
          config = await she.start(configPath, iEnv);
        } catch (er) {
          log('msg', 'error', er);
        }
        log('finished');
        return config;
      })();

    case 'abort':
      return she.abort(iEnv);

    case '--help':
      return she.help(iEnv);

    default:
      return she.help(iEnv);
  }
};

wProxy.help = (iEnv) => {
  let h = {
    usage: 'yyl proxy',
    commands: {
      'start': 'start proxy server',
      'abort': 'abort proxy server'
    },
    options: {
      '--help': 'print usage information'
    }
  };
  if (!iEnv.silent) {
    util.help(h);
  }
  return Promise.resolve(h);
};

wProxy.start = async function (ctx, iEnv) {
  const DEFAULT_CONFIG = {
    port: 8887
  };
  let config;
  let proxyConfig;
  if (typeof ctx === 'object') {
    config = ctx;
    config.proxy = util.extend(DEFAULT_CONFIG, config.proxy);
    proxyConfig = config.proxy;
  } else if (!ctx) {
    config = {};
    proxyConfig = DEFAULT_CONFIG;
    log('msg', 'warn', 'use default proxy config');
  } else {
    try {
      config = await extFn.parseConfig(ctx, iEnv, ['proxy']);
      proxyConfig = util.extend(true, DEFAULT_CONFIG, config.proxy);
    } catch (er) {
      config = {};
      proxyConfig = DEFAULT_CONFIG;
      log('msg', 'warn', `${er}, use default proxy config`);
    }
  }

  if (iEnv.proxy) {
    proxyConfig.port = iEnv.proxy;
  }

  if (!await extFn.checkPortUseage(proxyConfig.port)) {
    throw `port ${chalk.yellow(proxyConfig.port)} is occupied, please check`;
  }

  const proxyOpts = {
    port: proxyConfig.port,
    // gui
    webInterface: {
      enable: true,
      webPort: 8002
    },
    throttle: 10000,
    forceProxyHttps: false,
    wsIntercept: false,
    silent: true
  };

  if (!await extFn.checkPortUseage(proxyOpts.webInterface.webPort)) {
    throw `port ${chalk.yellow(proxyOpts.webInterface.webPort)} is occupied, please check`;
  }

  return await extFn.makeAwait((next) => {
    cache.server = new AnyProxy.ProxyServer(proxyOpts);

    const uiAddress = `http://${util.vars.LOCAL_SERVER}:${proxyOpts.webInterface.webPort}/`;

    cache.server.on('ready', async () => {
      log('msg', 'success', 'proxy server start');
      const localConfig = await wProxy.getMapping();
      Object.keys(localConfig.localRemote).forEach((key) => {
        log('msg', 'success', `proxy map: ${chalk.cyan(key)} => ${chalk.yellow(localConfig.localRemote[key])}`);
      });
      log('msg', 'success', `proxy ui address : ${chalk.yellow(uiAddress)}`);
      log('msg', 'success', `proxy server port: ${chalk.yellow(proxyConfig.port)}`);
      next(config);
    });

    cache.server.on('error', (e) => {
      throw e;
    });

    cache.server.start();
  });
};

wProxy.abort = function () {
  if (cache.server) {
    return new Promise((next) => {
      cache.server.close(() => {
        cache.server = null;
        return next();
      });
    });
  } else {
    return Promise.resolve(null);
  }
};

// 更新映射表
wProxy.updateMapping = async function (config) {
  await extFs.mkdirSync(util.vars.SERVER_DATA_PATH);
  const pxyConfig = config.proxy;
  if (!pxyConfig) {
    return;
  }

  if (!pxyConfig.localRemote) {
    pxyConfig.localRemote = {};
  }

  // hostname mapping
  if (config.commit && config.commit.hostname) {
    const localHostname = config.commit.hostname.replace(/[\\/]$/, '');
    const port = config.localserver && config.localserver.port;
    if (!pxyConfig.localRemote[localHostname] && port) {
      pxyConfig.localRemote[localHostname] = `//${util.vars.LOCAL_SERVER}:${port}`;
    }
  }
  fs.writeFileSync(util.vars.SERVER_PROXY_MAPPING_FILE, `module.exports = ${JSON.stringify(pxyConfig, null, 2)}`);
  log('msg', 'success', `proxy mapping ${chalk.green('updated')}`);
  return config;
};

// 获取映射表
wProxy.getMapping = function () {
  let r = {};
  if (fs.existsSync(util.vars.SERVER_PROXY_MAPPING_FILE)) {
    const ctx = fs.readFileSync(util.vars.SERVER_PROXY_MAPPING_FILE).toString();
    try {
      r = JSON.parse(ctx);
    } catch (er) {
      log('msg', 'warn', `wProxy.getMapping parse error ${er}, use default mapping`);
      return r;
    }
  }
  return Promise.resolve(r);
};

module.exports = wProxy;

