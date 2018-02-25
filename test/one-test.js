'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const tinylr = require('tiny-lr');

const util = require('../tasks/w-util.js');
const connect = require('connect');
const serveIndex = require('serve-index');
const serveStatic = require('serve-static');
const livereload = require('connect-livereload');

const runner = (next) => {
  const app = connect();
  app.use(livereload({
    port: 35729,
    src: 'http://localhost:35729/livereload.js?snipver=1'
  }));
  app.use((req, res, next) => {
    if (req.method == 'POST') {
      var filePath = path.join(__dirname, url.parse(req.url).pathname);

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
  app.use(serveStatic(__dirname, {
    'setHeaders': function(res) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }));
  app.use(serveIndex(__dirname));
  const server = http.createServer(app);

  server.listen(5000, (err) => {
    if (err) {
      return;
    }
    // tinylr().listen(12345);
  });
  console.log('start')
  const testPath = `http://${util.vars.LOCAL_SERVER}:5000/test.js`;
  http.get(testPath, (res) => {
    console.log(res.statusCode)
    server.close(() => {
      console.log('end');
      next();
    });
  });
};
let padding = 3;
(function doit() {
  if (padding--) {
    runner(() => {
      doit();
    });
  }
})();

