const fs = require('fs');
const path = require('path');
const wMock = function (op) {
  const DB_PATH = op.dbPath;
  const ROUTES_PATH = op.routesPath;
  let db = null;
  let routes = null;

  console.log(DB_PATH);
  if (fs.existsSync(DB_PATH)) {
    db = require(DB_PATH);
  }

  if (fs.existsSync(ROUTES_PATH)) {
    routes = require(ROUTES_PATH);
  }


  const url2db = function (url) {
    let tUrl = url;
    if (!db) {
      return;
    }

    // 路径匹配
    if (url === '/db') {
      return db;
    }

    if (routes) {
      Object.keys(routes).map((key) => {
        const dataMap = {

        };

        let i = 0;
        urlRegStr = key.replace(/:([^/&?]+)/g, (str, $1) => {
          dataMap[++i] = $1;
          return '([^/&?]+)';
        });

        const urlReg = new RegExp(`^${urlRegStr}$`, 'g');
        console.log(urlRegStr)
        if (url.match(urlReg)) {
          url.replace(urlReg, () => {
            const iArgv = [...arguments];
            console.log('iArgv', iArgv);
          });
          console.log('match!');
        }
      });
    }





    // TODO
  };

  const mocku = function (req, res, next) {
    const r = url2db(req.url);
    console.log('r', r)
    if (r) {
      console.log('iniin')
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json;charset=UTF-8');
      res.write(JSON.stringify(r));
      res.end();
    } else {
      next();
    }
  };

  return mocku;
};

module.exports = wMock;
