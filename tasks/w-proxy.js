'use strict';
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const extFs = require('yyl-fs');
const request = require('request');
// const url = require('url');
// const http = require('http');

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
  } else if (!ctx) {
    config = {};
    log('msg', 'warn', 'use default proxy config');
  } else {
    try {
      config = await extFn.parseConfig(ctx, iEnv, ['proxy', 'commit', 'localserver']);
    } catch (er) {
      config = {};
      log('msg', 'warn', `${er}, use default proxy config`);
    }
  }

  config = await wProxy.updateMapping(config, iEnv);
  proxyConfig = util.extend(true, DEFAULT_CONFIG, config.proxy);

  // 更新 本地映射
  if (iEnv.proxy) {
    proxyConfig.port = iEnv.proxy;
  }

  if (!await extFn.checkPort(proxyConfig.port)) {
    throw `port ${chalk.yellow(proxyConfig.port)} is occupied, please check`;
  }

  if (!AnyProxy.utils.certMgr.ifRootCAFileExists()) {
    await extFn.makeAwait((next) => {
      log('end');
      AnyProxy.utils.certMgr.generateRootCA((error, keyPath) => {
        log('start', 'server');
        // let users to trust this CA before using proxy
        if (!error) {
          const certDir = path.dirname(keyPath);
          log('msg', 'success', ['The cert is generated at', chalk.yellow.bold(certDir)]);
          util.openPath(certDir);
        } else {
          log('msg', 'error', ['error when generating rootCA', error]);
        }
        next();
      });
    });
  }

  const proxyOpts = {
    port: proxyConfig.port,
    // gui
    webInterface: {
      enable: true,
      webPort: 5001
    },
    rule: {
      async beforeSendRequest(req) {
        console.log('beforeSendRequest', req.url)
        const { localRemote, ignores } = cache.proxyConfig;
        if (typeof localRemote !== 'object') {
          return;
        }

        const iUrl = extFn.hideProtocol(req.url);

        let isIgnore = false;
        if (ignores && ignores.length) {
          ignores.forEach((key) => {
            const v1 = extFn.hideProtocol(key);
            if (iUrl === v1) {
              isIgnore = true;
            }
          });
        }

        if (isIgnore) {
          return null;
        }

        let proxyUrl = null;
        Object.keys(localRemote).forEach((key) => {
          const v1 = extFn.hideProtocol(key);
          if (iUrl.substr(0, v1.length) === v1) {
            proxyUrl = util.path.join(localRemote[key], iUrl.substr(v1.length));
          }
        });

        if (proxyUrl) {
          console.log('===', 'start', proxyUrl)
          return await extFn.makeAwait((next) => {
            // console.log('===', 'proxyUrl', proxyUrl)
            // const vOpts = {
            //   url: proxyUrl,
            //   headers: req.requestOptions.headers,
            //   method: req.requestOptions.method
            // };
            // const iMethod = req.requestOptions.method;
            // if (iMethod !== 'GET') {
            //   vOpts.body = req.requestData;
            // }

            // console.log('===>', vOpts.url, iMethod)
            // request(vOpts, (error, vRes, body) => {
            //   console.log('===', 'back', req.url, vRes.status)
            //   if (error || /^404|405$/.test(vRes.statusCode)) {
            //     return next(null);
            //   }
            //   return next({
            //     response: {
            //       statusCode: vRes.statusCode,
            //       header: vRes.headers,
            //       body: body
            //     }
            //   });
            // });
          });
        } else {
          return null;
        }
      }
    },
    throttle: 10000,
    forceProxyHttps: true,
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
      cache.server.close();
      cache.server = null;
      return next();
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
    return config;
  }

  if (!pxyConfig.localRemote) {
    pxyConfig.localRemote = {};
  }

  // hostname mapping
  if (config.commit && config.commit.hostname) {
    const localHostname = config.commit.hostname.replace(/[\\/]$/, '');
    const port = config.localserver && config.localserver.port;
    if (!pxyConfig.localRemote[localHostname] && port) {
      pxyConfig.localRemote[`${localHostname}/`] = `http://${util.vars.LOCAL_SERVER}:${port}/`;
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

