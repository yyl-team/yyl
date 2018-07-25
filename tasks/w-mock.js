const fs = require('fs');
const url = require('url');
const util = require('./w-util.js');
const wMock = function (op) {
  const DB_PATH = op.dbPath;
  const ROUTES_PATH = op.routesPath;
  let db = null;
  let routes = null;

  if (fs.existsSync(DB_PATH)) {
    db = util.requireJs(DB_PATH);
  }

  if (fs.existsSync(ROUTES_PATH)) {
    routes = util.requireJs(ROUTES_PATH);
  }

  const REG = {
    KEY: /:([^/&?]+)/g,
    ANY: /\*+/g,
    OPERATOR: /^(.+)_(gte|lte|ne|like)$/
  };

  // url db 匹配
  const db2data = function(remoteUrl) {
    if (!db) {
      return;
    }
    // 路径匹配
    if (remoteUrl === '/db') {
      return db;
    }

    if (remoteUrl === '/') {
      return;
    }

    const urlObj = url.parse(remoteUrl);

    const { pathname } = urlObj;
    const paths = pathname.split(/[\\/]+/);

    if (paths[paths.length - 1] === '') {
      return null;
    }

    if (paths[0] === '') {
      paths.splice(0, 1);
    }

    // url to data
    let rData = util.extend(true, {}, db);
    paths.map((key, index) => {
      if (index === paths.length - 1) {
        if (util.type(rData) == 'array') {
          let isMatch = null;
          rData.map((item) => {
            if (typeof item == 'object' && `${item.id}` === `${key}`) {
              isMatch = item;
              return true;
            }
          });
          rData = isMatch;
        } else {
          rData = rData[key];
        }
      } else {
        rData = rData[key];
      }


      if (!rData) {
        return true;
      }
    });

    let sParam;
    if (urlObj.search) {
      const searchStr = urlObj.search.replace(/^\?/, '');
      if (searchStr) {
        sParam = {};
        searchStr.split(/[&]+/).forEach((ctx) => {
          const ctxObj = ctx.split('=');
          sParam[ctxObj[0]] = ctxObj[1];
        });
      }
    }

    if (rData && sParam) {
      if (util.type(rData) !== 'array') {
        rData = {};
      } else {
        // sort: _sort, _order
        if (sParam._sort) {
          let sortKeys = sParam._sort.split(/\s*,\s*/);
          let order = 'desc';
          if (sParam._order !== 'desc') {
            order = 'asc';
          }

          rData.sort((item1, item2) => {
            let str1 = '';
            let str2 = '';
            sortKeys.map((key) => {
              if (item1[key]) {
                str1 += item1[key];
              }

              if (item2[key]) {
                str2 += item2[key];
              }
            });

            if (order !== 'asc') {
              return str2.localeCompare(str1);
            } else {
              return str1.localeCompare(str2);
            }
          });

          delete sParam._sort;
          delete sParam._order;
        }

        // slice: _start, _end, _limit
        if (sParam._start) {
          let iStart = +sParam._start;
          if (isNaN(iStart) || iStart < 0) {
            rData = [];
          } else {
            rData.splice(0, iStart);
          }
          if (sParam._end) {
            sParam._end = sParam._end - sParam._start;
          }
          delete sParam._start;
        }

        if (sParam._end) {
          let iEnd = +sParam._end;
          if (isNaN(iEnd) || iEnd < 0) {
            rData = [];
          } else {
            rData.splice(iEnd);
          }
          delete sParam._end;
        }

        if (sParam._limit) {
          let iLimit = + sParam._limit;
          if (isNaN(iLimit) || iLimit < 0) {
            rData = [];
          } else {
            if (rData.length > iLimit) {
              rData.splice(iLimit);
            }
          }

          delete sParam._limit;
        }

        // 暂时不做 获取子资源
        if (sParam._embed) {
          delete sParam._embed;
        }

        // 暂时不做 获取父资源
        if (sParam._expand) {
          delete sParam._expand;
        }

        Object.keys(sParam).forEach((key) => {
          // operator
          let iMatchs = key.match(REG.OPERATOR);
          if (iMatchs) {
            let oKey = iMatchs[1];
            let oCtrl = iMatchs[2];
            let iVal = decodeURIComponent(sParam[key]);
            let nVal = +iVal;
            let filterHandle;
            switch (oCtrl) {
              case 'gte':
                if (isNaN(nVal)) {
                  rData = [];
                } else {
                  filterHandle = (item) =>  {
                    if (item[oKey] >= nVal) {
                      return true;
                    }
                    return false;
                  };
                }
                break;

              case 'lte':
                if (isNaN(nVal)) {
                  rData = [];
                } else {
                  filterHandle = (item) =>  {
                    if (item[oKey] >= nVal) {
                      return true;
                    }
                    return false;
                  };
                }
                break;

              case 'ne':
                filterHandle = (item) =>  {
                  if (item[oKey] != iVal) {
                    return true;
                  }
                  return false;
                };
                break;

              case 'like':
                filterHandle = (item) =>  {
                  if (`${item[oKey]}`.match(new RegExp(iVal))) {
                    return true;
                  }
                  return false;
                };
                break;
            }

            if (rData.length && filterHandle) {
              rData = rData.filter(filterHandle);
            }
          } else {
            rData = rData.filter((item) =>  {
              if (item[key] == sParam[key]) {
                return true;
              }
              return false;
            });
          }
        });
      }
    }
    return rData;
  };

  // url 路由匹配
  const routes2db = function(remoteUrl) {
    let tUrl = remoteUrl;
    if (routes) {
      Object.keys(routes).map((key) => {
        if (typeof routes[key] !== 'string') {
          return;
        }
        const dataKeys = [];
        const data = {};
        const urlRegStr = key
          .replace(REG.KEY, (str, $1) => {
            dataKeys.push($1);
            return '([^/&?]+)';
          })
          .replace(REG.ANY, () => {
            return '.*';
          });

        const urlReg = new RegExp(`^${urlRegStr}$`, '');
        const resultMatch = remoteUrl.match(urlReg);
        if (resultMatch && resultMatch.length) {
          resultMatch.shift();
          resultMatch.map((val, i) => {
            data[dataKeys[i]] = val;
          });
          tUrl = routes[key].replace(REG.KEY, (str, key) => {
            if (data[key]) {
              return data[key];
            } else {
              return str;
            }
          });
          return true;
        }
      });
    }
    return tUrl;
  };

  const url2Data = function (remoteUrl) {
    return db2data(routes2db(remoteUrl));
  };

  const mocku = function (req, res, next) {
    const r = url2Data(req.url);
    if (r) {
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
