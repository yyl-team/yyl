'use strict';
const path = require('path');
const http = require('http');
const https = require('https');
const net = require('net');
const fs = require('fs');
const url = require('url');
const chalk = require('chalk');
const tls = require('tls');
const EasyCert = require('node-easy-cert');
const request = require('request');

const log = require('./w-log.js');
const util = require('./w-util.js');
const easyCert = new EasyCert({
  rootDirPath: util.vars.SERVER_CERTS_PATH,
  defaultCertAttrs: [
    { name: 'countryName', value: 'CN' },
    { name: 'organizationName', value: 'AnyProxy' },
    { shortName: 'ST', value: 'SH' },
    { shortName: 'OU', value: 'AnyProxy SSL Proxy' }
  ]
});

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

// var PROXY_INFO_HTML = [
//   '<div id="YYL_PROXY_INFO" style="position: fixed; z-index: 10000; bottom: 10px; right: 10px; padding: 0.2em 0.5em; background: #000; background: rgba(0,0,0,.5); font-size: 1.5em; color: #fff;">yyl proxy</div>',
//   '<script>setTimeout(function(){ var el = document.getElementById("YYL_PROXY_INFO"); try{el.parentNode.removeChild(el)}catch(er){} }, 10000)</script>'
// ].join('');

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
  },
  createHttpsServer(oreq, socket, head, done) {
    const srvUrl = url.parse(`http://${oreq.url}`);
    let srvSocket = null;
    easyCert.getCertificate(srvUrl.hostname, (err, keyContent, certContent) => {
      if (err) {
        return done(err);
      }
      const server = new https.Server({
        key: keyContent,
        cert: certContent,
        SNICallback: (hostname, next) => {
          easyCert.getCertificate(hostname, (err, sKey, sCert) => {
            next(null, tls.createSecureContext({
              key: sKey,
              cert: sCert
            }));
          });
        }
      });

      server.on('request', (req, res) => {
        done(null, req, res, srvSocket);
      });

      server.on('error', () => {
        if (srvSocket) {
          srvSocket.end();
        }
      });

      server.listen(0, () => {
        const address = server.address();
        srvSocket = net.connect(address.port, '127.0.0.1', () => {
          socket.write(`HTTP/${oreq.httpVersion} 200 OK\r\n\r\n`, 'UTF-8');
          srvSocket.write(head);
          srvSocket.pipe(socket);
          socket.pipe(srvSocket);
        });
        srvSocket.on('error', () => {
          srvSocket.end();
          server.end();
        });
      });
    });
  },
  proxyToLocal(op, req, done) {
    let reqUrl = req.url;
    if (!/^http[s]?:/.test(reqUrl)) { // 适配 https
      reqUrl = `https://${req.headers.host}${req.url}`;
    }
    const iAddrs = Object.keys(op.localRemote || {});

    // 本地代理
    const remoteUrl = reqUrl.replace(/\?.*$/, '').replace(/#.*$/, '');
    let proxyUrl = '';
    let proxyIgnore = false;

    if (op.ignores && ~op.ignores.indexOf(remoteUrl)) {
      proxyIgnore = true;
    }

    if (!proxyIgnore) {
      iAddrs.map((addr) => {
        var localAddr = op.localRemote[addr];

        if (!localAddr || !addr) {
          return true;
        }

        if (addr === reqUrl.substr(0, addr.length)) {
          const subAddr = util.joinFormat(localAddr, reqUrl.substr(addr.length));
          if (/^http(s)?:/.test(localAddr)) {
            proxyUrl = subAddr;
            return false;
          }
        }
      });
    }

    if (proxyIgnore || !proxyUrl) {
      done(null);
    } else { // 透传 or 转发
      const vOpts = url.parse(proxyUrl);
      vOpts.method = req.method;
      vOpts.headers = req.headers;
      const vRequest = http.request(vOpts, (vRes) => {
        if (/^404|405$/.test(vRes.statusCode)) {
          vRes.on('end', () => {
            done(null);
          });

          return vRequest.abort();
        } else {
          done(vRes);
        }
      });
      req.pipe(vRequest);
    }
  }
};

const cache = {
  server: null,
  crtMgr: null,
  index: 0
};

const wProxy = {
  init: function(op, done) {
    const iPort = op.port || 8887;

    // cert
    new util.Promise((next) => {
      if (easyCert.isRootCAFileExists()) {
        log('msg', 'success', ['cert  cert already exists']);
        log('msg', 'success', ['cert  please double click the rootCA.crt and trust it']);
        log('msg', 'success', [`cert  ${chalk.yellow(util.vars.SERVER_CERTS_PATH)}`]);
        next();
      } else {
        log('end');
        easyCert.generateRootCA({
          commonName: 'yyl-cert',
          overwrite: false
        }, (err) => {
          if (err) {
            log('msg', 'warn', ['cert: generate error', err]);
          } else {
            log('msg', 'success', ['cert: generate success']);
          }
          next();
        });
      }
    // server
    }).then(() => {
      const server = http.createServer((req, res) => {
        fn.proxyToLocal(op, req, (vRes) => {
          if (!vRes) { // 透传
            const vOpts = url.parse(req.url);
            vOpts.method = req.method;
            vOpts.headers = req.headers;

            const vRequest = http.request(vOpts, (vvRes) => {
              res.writeHead(vvRes.statusCode, vvRes.headers);
              vvRes.pipe(res);
            });
            vRequest.on('error', () => {
              res.end();
            });

            req.pipe(vRequest);
          } else {
            res.writeHead(vRes.statusCode, vRes.headers);
            vRes.pipe(res);
          }
        });
      });

      log('msg', 'success', 'proxy server start');
      Object.keys(op.localRemote).forEach((key) => {
        log('msg', 'success', `proxy map: ${chalk.cyan(key)} => ${chalk.yellow(op.localRemote[key])}`);
      });
      log('msg', 'success', `proxy server port: ${chalk.yellow(iPort)}`);

      server.listen(iPort);

      // ws 监听, 转发
      server.on('connect', (oReq, socket, head) => {
        fn.createHttpsServer(oReq, socket, head, (err, req, res, vSocket) => {
          fn.proxyToLocal(op, req, (vRes) => {
            if (!vRes) { // 这部分有问题
              const x = request({
                url: `https://${req.headers.host}${req.url}`,
                headers: req.headers,
                method: req.method
              });
              req.pipe(x);
              x.pipe(res);
            } else {
              res.writeHead(vRes.statusCode, vRes.headers);
              vRes.pipe(res);
            }
          });
        });
      });

      server.on('error', (err) => {
        if (err.code == 'EADDRINUSE') {
          log('msg', 'error', `proxy server start fail: ${chalk.yellow(iPort)} is occupied, please check`);
        } else {
          log('msg', 'error', ['proxy server error', err]);
        }
      });

      cache.server = server;

      return done && done();
    }).start();
  },
  abort: function() {
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
  }
};

module.exports = wProxy;


