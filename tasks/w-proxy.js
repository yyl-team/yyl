'use strict';
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const extFs = require('yyl-fs');
const request = require('request');

const log = require('./w-log.js');
const util = require('./w-util.js');
const extFn = require('./w-extFn.js');

const AnyProxy = require('anyproxy');

const cache = {
  server: null,
  index: 0,
  proxyConfig: {},
  uiAddress: null,
  port: null
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

  if (!await extFn.checkPort(proxyConfig.port)) {
    throw `port ${chalk.yellow(proxyConfig.port)} is occupied, please check`;
  }

  const proxyOpts = {
    port: proxyConfig.port,
    // gui
    webInterface: {
      enable: true,
      webPort: 8002
    },
    rule: {
      beforeSendRequest(req) {
        // console.log('===', req);
        // TODO
        return Promise.resolve(null);
      }
    },
    throttle: 10000,
    forceProxyHttps: false,
    wsIntercept: false,
    silent: true
  };

  if (!await extFn.checkPort(proxyOpts.webInterface.webPort)) {
    throw `port ${chalk.yellow(proxyOpts.webInterface.webPort)} is occupied, please check`;
  }

  return await extFn.makeAwait((next) => {
    cache.server = new AnyProxy.ProxyServer(proxyOpts);

    cache.uiAddress = `http://${util.vars.LOCAL_SERVER}:${proxyOpts.webInterface.webPort}/`;
    cache.port = proxyConfig.port;

    cache.server.on('ready', async () => {
      log('msg', 'success', 'proxy server start');
      await wProxy.updateCachePxyConfig();
      next(config);
    });

    cache.server.on('error', (e) => {
      throw e;
    });
    fs.watchFile(util.vars.SERVER_PROXY_MAPPING_FILE, async (curr, prev) => {
      log('clear');
      log('start', 'server', 'proxy config changing');
      if (curr.ctime !== prev.ctime) {
        await wProxy.updateCachePxyConfig();
      }
      log('finished');
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
  let r = {
    localRemote: []
  };
  if (fs.existsSync(util.vars.SERVER_PROXY_MAPPING_FILE)) {
    const data = util.requireJs(util.vars.SERVER_PROXY_MAPPING_FILE);
    try {
      r = util.extend(true, r, data);
    } catch (er) {
      log('msg', 'warn', `wProxy.getMapping parse error ${er}, use default mapping`);
      return r;
    }
  }
  return Promise.resolve(r);
};

// 更新 缓存中的 proxyConfig
wProxy.updateCachePxyConfig = async function () {
  cache.proxyConfig = await wProxy.getMapping();
  Object.keys(cache.proxyConfig.localRemote).forEach((key) => {
    log('msg', 'success', `proxy map: ${chalk.cyan(key)} => ${chalk.yellow.bold(cache.proxyConfig.localRemote[key])}`);
  });

  if (cache.uiAddress) {
    log('msg', 'success', `proxy ui address : ${chalk.yellow.bold(cache.uiAddress)}`);
  }

  if (cache.port) {
    log('msg', 'success', `proxy server port: ${chalk.yellow.bold(cache.port)}`);
  }
};

module.exports = wProxy;

