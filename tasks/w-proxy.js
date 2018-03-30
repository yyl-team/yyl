'use strict';
var path = require('path');
var http = require('http');
var net = require('net');
var fs = require('fs');
var url = require('url');
var chalk = require('chalk');

var log = require('./w-log.js');
var util = require('./w-util.js');

var MIME_TYPE_MAP = {
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
const PROXY_INFO_HTML = [
  '<div id="YYL_PROXY_INFO" style="position: fixed; z-index: 10000; bottom: 10px; right: 10px; padding: 0.2em 0.5em; background: #000; background: rgba(0,0,0,.5); font-size: 1.5em; color: #fff;">yyl proxy</div>',
  '<script>setTimeout(function(){ var el = document.getElementById("YYL_PROXY_INFO"); try{el.parentNode.removeChild(el)}catch(er){} }, 10000)</script>'
].join('');

var fn = {
  samePrefix: function(shortPath, longPath) {
    return shortPath === longPath.substr(0, shortPath.length);
  },
  blank: function(num) {
    return new Array(num + 1).join(' ');
  },
  log: {
    STRING_COUNT: 55,
    u: function(src, dest) {

    },
    to: function(url) {
      var iUrl = url;
      var lines = [];
      var self = this;
      while (iUrl.length  > self.STRING_COUNT) {
        lines.push(iUrl.substring(0, self.STRING_COUNT));
        iUrl = iUrl.substring(self.STRING_COUNT);
      }
      lines.push(iUrl);

      if (lines.length > 3) {
        lines.length = 3;
        lines[2] = `${lines[2].substr(0, lines[2].length - 3)  }...`;
      }

      iUrl = lines.join(`\n${  fn.blank(20)}`);
      log('msg', 'proxyTo', iUrl);
    },

    back: function(status, url) {
      var iUrl = url;
      var lines = [];
      var self = this;
      while (iUrl.length  > self.STRING_COUNT) {
        lines.push(iUrl.substring(0, self.STRING_COUNT));
        iUrl = iUrl.substring(self.STRING_COUNT);
      }
      lines.push(iUrl);

      if (lines.length > 3) {
        lines.length = 3;
        lines[2] = `${lines[2].substr(0, lines[2].length - 3)  }...`;
      }

      iUrl = lines.join(`\n${  fn.blank(20)}`);

      log('msg', 'proxyBack', iUrl);
    }
  }
};

const cache = {
  server: null
};

var wProxy = {
  init: function(op, done) {
    const iPort = op.port || 8887;

    const server = http.createServer((req, res) => {
      // https://stackoverflow.com/questions/13472024/simple-node-js-proxy-by-piping-http-server-to-http-request
      // req.pause();
      // req.resume();
      const reqUrl = req.url;
      const proxySrcs = Object.keys(op.localRemote || {});

      // 本地代理
      const reqPath = reqUrl.replace(/\?.*$/, '').replace(/#.*$/, '');
      let localData;
      let localUrl;
      let localServerPath;
      let proxyIgnore = false;

      if (op.ignores && ~op.ignores.indexOf(reqPath)) {
        proxyIgnore = true;
      }

      proxySrcs.some((proxySrc) => {
        const proxyDest = op.localRemote[proxySrc];

        if (!proxyDest) {
          return true;
        }

        if (fn.samePrefix(proxySrc, reqPath)) {
          let porxyDestPath = util.path.join(proxyDest, path.relative(proxySrc, reqPath));

          if (/^http(s)?:/.test(reqUrl)) {
            localServerPath = porxyDestPath;
            return false;
          }

          if (fs.existsSync(porxyDestPath)) {
            localData = fs.readFileSync(porxyDestPath);
            localUrl = porxyDestPath;
            return false;
          }
        }
      });

      // 本地文件
      if (localData && !proxyIgnore) {
        fn.log.u({
          src: req.url,
          dest: localUrl,
          statusCode: 200
        });
        let iExt = path.extname(reqUrl).slice(1);
        if (MIME_TYPE_MAP[iExt]) {
          res.setHeader('Content-Type', MIME_TYPE_MAP[iExt]);
        }
        res.write(localData);
        res.end();
        return;
      }

      const reqOpts =  url.parse(reqUrl);
      reqOpts.headers = req.headers;
      reqOpts.method = req.method;

      let body = [];
      const iExt = path.extname(reqUrl).slice(1);
      if (MIME_TYPE_MAP[iExt]) {
        res.setHeader('Content-Type', MIME_TYPE_MAP[iExt]);
      }

      req.on('data', (chunk) => {
        body.push(chunk);
      });
      req.on('end', () => {
        body = Buffer.concat(body).toString();
        if (localServerPath) {
          const vOpts = url.parse(localServerPath);
          vOpts.method = req.method;
          vOpts.headers = req.headers;
          vOpts.body = body;
          const vRequest = http.request(vOpts, (vRes) => {
            if (/^404|405$/.test(vRes.statusCode)) {
              vRes.on('end', () => {
                // NORMAL LINK
              });
              return vRequest.abort();
            }
            vRes.on('data', (chunk) => {
              res.write(chunk, 'binary');
            });
            vRes.on('end', () => {
              fn.log.u({
                src: reqUrl,
                dest: localServerPath,
                statusCode: vRes.statusCode
              });
              res.end();
            });
            vRes.on('error', () => {
              res.end();
            });
            const iHeader = util.extend(true, {}, vRes.headers);
            const iType = vRes.headers['content-type'];
            if (iType) {
              res.setHeader('Content-Type', iType);
            } else {
              const iExt = path.extname(req.url).slice(1);

              if (MIME_TYPE_MAP[iExt]) {
                res.setHeader('Content-Type', MIME_TYPE_MAP[iExt]);
              }
            }
            res.writeHead(vRes.statusCode, iHeader);
          });
        } else {
          // NORMAL_LINK

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
        log('msg', 'error', `proxy server start fail: ${chalk.yellow(iPort)} is occupied, please check`);
      } else {
        log('msg', 'error', ['proxy server error', err]);
      }
    });

    cache.server = server;

    return done && done();
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
