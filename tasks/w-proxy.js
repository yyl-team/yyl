'use strict';
const path = require('path');
const http = require('http');
const net = require('net');
const fs = require('fs');
const url = require('url');
const chalk = require('chalk');

const log = require('./w-log.js');
const util = require('./w-util.js');
const extFn = require('./w-extFn.js');
const pkg = require('../package.json');

const MIME_TYPE_MAP = {
  'css': 'text/css',
  'js': 'text/javascript',
  'html': 'text/html',
  'xml': 'text/xml',
  'txt': 'text/plain',

  'json': 'application/json',
  'pdf': 'application/pdf',
  'swf': 'application/x-shockwave-flash',

  'woff': 'application/font-woff',
  'ttf': 'application/font-ttf',
  'eot': 'application/vnd.ms-fontobject',
  'otf': 'application/font-otf',

  'wav': 'audio/x-wav',
  'wmv': 'video/x-ms-wmv',
  'mp4': 'video/mp4',

  'gif': 'image/gif'
  ,
  'ico': 'image/x-icon',
  'jpeg': 'image/jpeg',
  'jpg': 'image/jpeg',
  'png': 'image/png',
  'svg': 'image/svg+xml',
  'tiff': 'image/tiff'

};

var fn = {
  blank: function(num) {
    return new Array(num + 1).join(' ');
  },
  log: {
    STRING_COUNT: 55,
    u: function(obj) {
      const type = cache.index++ % 2 ? 'proxy' : 'proxy2';
      if (obj.src === obj.dest) {
        obj.dest = 'remote';
      }
      let printUrl = '';
      const iUrl = url.parse(obj.src);

      const max = 20;
      if (iUrl.search && iUrl.search.length > max) {
        iUrl.search = `${iUrl.search.substr(0, max - 3)}...`;
        printUrl = `${iUrl.protocol}//${iUrl.hostname}${iUrl.port? `:${iUrl.port}` : ''}${iUrl.pathname}${iUrl.search}${iUrl.hash || ''}`;
      } else {
        printUrl = obj.src;
      }

      let printStatus;
      switch (`${obj.status}`.substr(0, 1)) {
        case '2':
          printStatus = chalk.green(obj.status);
          break;

        case '3':
          printStatus = chalk.yellow(obj.status);
          break;

        case '4':
          printStatus = chalk.gray(obj.status);
          break;

        case '5':
          printStatus = chalk.red(obj.status);
          break;

        default:
          printStatus = chalk.gray(obj.status);
          break;
      }


      util.infoBar.print(type, {
        barLeft: [
          `=> ${chalk.cyan(printUrl)}`,
          `<= ${printStatus} ${chalk.yellow(obj.dest)}`
        ]
      }).end();
    }
  }
};

const cache = {
  server: null,
  index: 0
};

const wProxy = (ctx, iEnv, configPath) => {
  const she = wProxy;
  switch (ctx) {
    case 'start':
      return (async () => {
        log('clear');
        log('yyl', `${chalk.yellow(pkg.version)}`);
        log('cmd', `yyl proxy ${ctx} ${util.envStringify(iEnv)}`);
        log('start', 'server', 'proxy server init...');
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

    case '--h':
    case '--help':
      return she.help(iEnv);

    default:
      return she.help(iEnv);
  }
};

wProxy.start = async function (ctx, iEnv) {
  const DEFAULT_CONFIG = {
    port: 8887,
    localRemote: {},
    ignores: []
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
      config = await extFn.parseConfig(ctx, iEnv, ['localserver', 'proxy', 'commit']);
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

  if (config && config.commit && config.commit.hostname) {
    if (!proxyConfig.localRemote) {
      proxyConfig.localRemote = {};
    }
    let key = config.commit.hostname.replace(/[\\/]$/, '');

    // 处理 hostname 中 不带协议的情况
    if (/^[/]{2}\w/.test(key)) {
      key = `http:${key}`;
    }
    const val = util.joinFormat(`http://127.0.0.1:${config.localserver.port}`);
    proxyConfig.localRemote[key] = val;
  }

  const portCanUse = await extFn.checkPort(proxyConfig.port);
  if (!portCanUse) {
    throw `port ${chalk.yellow(proxyConfig.port)} was occupied, please check`;
  }

  await extFn.makeAwait((next) => {
    wProxy.init(proxyConfig, () => {
      next(config);
    });
  });
  return config;
};

wProxy.init = function (op, done) {
  const iPort = op.port || 8887;

  const server = http.createServer((req, res) => {
    const reqUrl = req.url;
    const iAddrs = Object.keys(op.localRemote || {});

    // 本地代理
    const remoteUrl = reqUrl.replace(/\?.*$/, '').replace(/#.*$/, '');
    let localData = '';
    let localUrl = '';
    let httpRemoteUrl = '';
    let proxyIgnore = false;

    if (op.ignores && ~op.ignores.indexOf(remoteUrl)) {
      proxyIgnore = true;
    }

    iAddrs.forEach((addr) => {
      var localAddr = op.localRemote[addr];

      if (!localAddr || !addr) {
        return true;
      }


      if (addr === remoteUrl.substr(0, addr.length)) {
        var subAddr = util.joinFormat(localAddr, remoteUrl.substr(addr.length));

        if (/^http(s)?:/.test(localAddr)) {
          httpRemoteUrl = subAddr;
          return false;
        }

        if (fs.existsSync(subAddr)) {
          localData = fs.readFileSync(subAddr);
          localUrl = subAddr;
          return false;
        }
      }
    });

    if (localData && !proxyIgnore) { // 存在本地文件
      fn.log.u({
        src: reqUrl,
        dest: localUrl,
        status: 200
      });

      const iExt = path.extname(req.url).replace(/^\./, '');
      if (MIME_TYPE_MAP[iExt]) {
        res.setHeader('Content-Type', MIME_TYPE_MAP[iExt]);
      }

      res.write(localData);
      res.end();
    } else { // 透传 or 转发
      let iUrl = httpRemoteUrl || req.url;
      if (proxyIgnore) {
        iUrl = req.url;
      }
      let body = [];
      const linkit = function(iUrl, iBuffer) {
        const vOpts = url.parse(iUrl);
        vOpts.method = req.method;
        vOpts.headers = req.headers;
        vOpts.body = body;


        const vRequest = http.request(vOpts, (vRes) => {
          if (/^404|405$/.test(vRes.statusCode) && httpRemoteUrl == iUrl) {
            vRes.on('end', () => {
              linkit(req.url, iBuffer);
            });

            return vRequest.abort();
          }

          vRes.on('data', (chunk) => {
            res.write(chunk, 'binary');
          });

          vRes.on('end', () => {
            fn.log.u({
              src: reqUrl,
              dest: iUrl,
              status: vRes.statusCode
            });

            // if(/text\/html/.test(res.getHeader('content-type'))){
            //     res.write(PROXY_INFO_HTML);
            // }
            res.end();
          });
          vRes.on('error', () => {
            res.end();
          });

          const iHeader = util.extend(true, {}, vRes.headers);

          // 设置 header
          const iType = vRes.headers['content-type'];
          if (iType) {
            res.setHeader('Content-Type', iType);
          } else {
            const iExt = path.extname(req.url).replace(/^\./, '');

            if (MIME_TYPE_MAP[iExt]) {
              res.setHeader('Content-Type', MIME_TYPE_MAP[iExt]);
            }
          }

          res.writeHead(vRes.statusCode, iHeader);
        });

        vRequest.on('error', () => {
          res.end();
        });

        vRequest.write(body);
        vRequest.end();
      };

      req.on('data', (chunk) => {
        body.push(chunk);
      });


      req.on('end', () => {
        body = Buffer.concat(body).toString();
        linkit(iUrl, body);
      });
    }
  });

  Object.keys(op.localRemote).forEach((key) => {
    log('msg', 'success', `proxy map: ${chalk.cyan(key)} => ${chalk.yellow(op.localRemote[key])}`);
  });
  log('msg', 'success', `proxy port     : ${chalk.yellow.bold(iPort)}`);

  server.listen(iPort);

  // ws 监听, 转发
  server.on('connect', (req, socket) => {
    var addr = req.url.split(':');
    //creating TCP connection to remote server
    var conn = net.connect(addr[1] || 443, addr[0], () => {
      // tell the client that the connection is established
      socket.write(`HTTP/${  req.httpVersion  } 200 OK\r\n\r\n`, 'UTF-8', () => {
        // creating pipes in both ends
        conn.pipe(socket);
        socket.pipe(conn);
      });
    });

    socket.on('error', () => {
      socket.end();
      conn.end();
    });

    conn.on('error', () => {
      socket.end();
      conn.end();
    });
  });

  server.on('error', (err) => {
    if (err.code == 'EADDRINUSE') {
      log('msg', 'error', `proxy server start fail: ${chalk.yellow(iPort)} was occupied, please check`);
    } else {
      log('msg', 'error', ['proxy server error', err]);
    }
  });

  cache.server = server;

  return done && done();
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

module.exports = wProxy;

