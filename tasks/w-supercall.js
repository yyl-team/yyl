'use strict';
var util = require('./w-util.js');
var log = require('./w-log.js');
var path = require('path');
var fs = require('fs');
var querystring = require('querystring');
var revHash = require('rev-hash');
var Concat = require('concat-with-sourcemaps');
var chalk = require('chalk');


var
  supercall = {
    // 执行 concat 操作
    concat: function(op) {
      return new Promise((next, err) => {
        const config = util.getConfigSync(op);
        if (!config) {
          return err('concat run fail, config parse error');
        }

        const concatIt = function(dest, srcs) {
          if (op.concatType && path.extname(dest).replace(/^\./, '') != op.concatType)   {
            return;
          }
          var concat = new Concat(false, dest, '\n');
          srcs.forEach((item) => {
            if (!fs.existsSync(item)) {
              log('msg', 'warn', `${item} is not exists, break`);
              return;
            }

            if (path.extname(item) == '.js') {
              concat.add(null, `;/* ${  path.basename(item)  } */`);
            } else {
              concat.add(null, `/* ${  path.basename(item)  } */`);
            }
            concat.add(item, fs.readFileSync(item));
          });

          util.mkdirSync(path.dirname(dest));
          fs.writeFileSync(dest, concat.content);
          log('msg', 'concat', [
            dest,
            srcs.map((p) => {
              return util.printIt(p);
            })
          ]);
        };
        if (config.concat) {
          for (var dist in config.concat) {
            if (config.concat.hasOwnProperty(dist)) {
              concatIt(dist, config.concat[dist]);
            }
          }
          log('msg', 'success', 'concat finished');
          next();
        } else {
          log('msg', 'success', 'concat finished, config.concat is null');
          next();
        }
      });
    },
    concatCss: function(op) {
      return supercall.concat(util.extend({}, op, {concatType: 'css'}));
    },
    concatJs: function(op) {
      return supercall.concat(util.extend({}, op, {concatType: 'js'}));
    },
    // 执行完 watch 后
    watchDone: function(op) {
      return new Promise((next, err) => {
        if (op.ver == 'remote') {
          return;
        }

        var config = util.getConfigSync(op);
        if (!config) {
          return err('watch-done task run fail, config parse error');
        }

        var htmls = util.readFilesSync(config.alias.destRoot, /\.html$/);
        var addr;
        var addrDebug;
        var localServerAddr = `http://${util.vars.LOCAL_SERVER}:${config.localserver.port}`;
        var localServerAddr2 = `http://127.0.0.1:${  config.localserver.port}`;
        var iHost = config.commit.hostname.replace(/\/$/, '');

        htmls.sort((a, b) => {
          var aName = path.basename(a);
          var bName = path.basename(b);
          var reg = /^index|default$/;
          var aReg = reg.exec(aName);
          var bReg = reg.exec(bName);

          if (aReg && !bReg) {
            return -1;
          } else if (!aReg && bReg) {
            return 1;
          } else {
            return a.localeCompare(b);
          }
        });

        if (op.proxy) {
          var iAddr = '';
          if (config.proxy && config.proxy.localRemote) {
            for (var key in config.proxy.localRemote) {
              iAddr = config.proxy.localRemote[key].replace(/\/$/, '');
              if ((iAddr === localServerAddr || iAddr === localServerAddr2) && key.replace(/\/$/, '') !== iHost) {
                addr = key;
                break;
              }
            }
          }

          if (!addr) {
            addr = config.commit.hostname;
          }
        } else {
          addr = localServerAddr;
        }

        if (!op.silent) {
          if (htmls.length) {
            addr = util.joinFormat(addr, path.relative(config.alias.destRoot, htmls[0]));
            addrDebug = util.joinFormat(
              localServerAddr2,
              path.relative(config.alias.destRoot, htmls[0])
            );
          }

          log('msg', 'success', 'open addr:');
          log('msg', 'success', addr);
          util.openBrowser(addr);
          if (op.debug) {
            log('msg', 'success', 'open debug addr:');
            log('msg', 'success', addrDebug);
            util.openBrowser(addrDebug);
          }
        } else {
          log('msg', 'success', 'watch-done finished');
        }
        next();
      });
    },
    // rev-manifest 生成
    rev: {
      fn: {
        mark: {
          source: {
            create: [],
            update: [],
            other: []
          },
          add: function(type, iPath) {
            var self = this;
            self.source[type in self.source? type: 'other'].push(iPath);
          },
          reset: function() {
            var self = this;
            Object.keys(self.source).forEach((key) => {
              self.source[key] = [];
            });
          },
          print: function() {
            var source = this.source;
            util.msg.rev([
              chalk.green('create: ') + source.create.length,
              chalk.cyan('update: ') + source.update.length,
              chalk.gray('other: ') + source.other.length
            ].join(', '));
          }
        },

        // 路径纠正
        resolveUrl: function(cnt, filePath, op) {
          var
            REG = {
              HTML_PATH_REG: /(src|href|data-main|data-original)(\s*=\s*)(['"])([^'"]*)(["'])/ig,
              HTML_SCRIPT_REG: /(<script[^>]*>)([\w\W]*?)(<\/script>)/ig,
              HTML_IGNORE_REG: /^(about:|data:|javascript:|#|\{\{)/,
              HTML_SCRIPT_TEMPLATE_REG: /type\s*=\s*['"]text\/html["']/,
              HTML_ALIAS_REG: /^(\{\$)(\w+)(\})/g,

              HTML_STYLE_REG: /(<style[^>]*>)([\w\W]*?)(<\/style>)/ig,

              CSS_PATH_REG: /(url\s*\(['"]?)([^'"]*?)(['"]?\s*\))/ig,
              CSS_PATH_REG2: /(src\s*=\s*['"])([^'" ]*?)(['"])/ig,
              CSS_IGNORE_REG: /^(about:|data:)/,

              IS_HTTP: /^(http[s]?:)|(\/\/\w)/
            };
          var iExt = path.extname(filePath).replace(/^\./g, '');
          var iDir = path.dirname(filePath);
          var config = util.getConfigCacheSync();
          var iHostname = (function() {
            if (op.isCommit || op.ver  == 'remote') {
              return config.commit.hostname;
            } else {
              return '/';
            }
          })();
          var r = '';
          var htmlReplace = function(iCnt) {
            iCnt = iCnt.replace(REG.HTML_SCRIPT_REG, (str, $1, $2, $3) => { // 隔离script 标签
              if ($1.match(REG.HTML_SCRIPT_TEMPLATE_REG)) {
                return str;
              } else {
                return $1 + querystring.escape($2) + $3;
              }
            }).replace(REG.HTML_STYLE_REG, (str, $1, $2, $3) => { // 隔离 style 标签
              return $1 + querystring.escape($2) + $3;
            }).replace(REG.HTML_PATH_REG, (str, $1, $2, $3, $4, $5) => {
              var iPath = $4;

              if (iPath.match(REG.HTML_IGNORE_REG)) {
                return str;
              } else if (iPath.match(REG.HTML_ALIAS_REG)) { // 构建语法糖 {$key}
                var isMatch = false;

                iPath = iPath.replace(
                  REG.HTML_ALIAS_REG,
                  (str, $1, $2) => {
                    if (config.alias[$2]) {
                      isMatch = true;
                      return config.alias[$2];
                    } else {
                      return '';
                    }
                  }
                );

                if (isMatch && iPath && fs.existsSync(iPath)) {
                  iPath = util.path.join(
                    iHostname,
                    util.path.relative(config.alias.destRoot, iPath)
                  );

                  return $1 + $2 + $3 + iPath + $5;
                } else {
                  return str;
                }
              } else {
                // url format
                iPath = util.path.join(iPath);

                // url absolute
                if (!iPath.match(REG.IS_HTTP) && !path.isAbsolute(iPath)) {
                  iPath = util.path.join(
                    iHostname,
                    util.path.relative(config.alias.destRoot, iDir),
                    iPath
                  );
                }

                return $1 + $2 + $3 + iPath + $5;
              }
            }).replace(REG.HTML_SCRIPT_REG, (str, $1, $2, $3) => {
              if ($1.match(REG.HTML_SCRIPT_TEMPLATE_REG)) {
                return str;
              } else {
                return $1 + querystring.unescape($2) + $3;
              }
            }).replace(REG.HTML_STYLE_REG, (str, $1, $2, $3) => { // 解除隔离 style 标签
              return $1 + querystring.unescape($2) + $3;
            });

            return iCnt;
          };
          var cssReplace = function(iCnt) {
            var filterHandle = function(str, $1, $2, $3) {
              var iPath = $2;

              if (iPath.match(REG.CSS_IGNORE_REG)) {
                return str;
              } else {
                iPath = util.path.join($2);
                // url absolute
                if (!iPath.match(REG.IS_HTTP) && !path.isAbsolute(iPath)) {
                  iPath = util.path.join(
                    op.remotePath ? op.remotePath : config.commit.hostname,
                    util.path.relative(config.alias.destRoot, iDir),
                    iPath
                  );
                }

                return $1 + iPath + $3;
              }
            };

            return iCnt
              .replace(REG.CSS_PATH_REG, filterHandle)
              .replace(REG.CSS_PATH_REG2, filterHandle);
          };
          switch (iExt) {
            case 'html':
              r = htmlReplace(cnt);
              break;

            case 'css':
              r = cssReplace(cnt);
              break;

            default:
              r = cnt;
              break;
          }

          return r;
        },
        // hash map 生成
        buildHashMap: function(iPath, revMap) {
          var config = util.getConfigCacheSync();
          var revSrc = util.joinFormat(path.relative(config.alias.revRoot, iPath));
          var hash = `-${  revHash(fs.readFileSync(iPath))}`;
          var revDest = revSrc.replace(/(\.[^.]+$)/g, `${hash  }$1`);

          revMap[revSrc] = revDest;
        },
        // 文件 hash 替换
        fileHashPathUpdate: function(iPath, revMap, op) {
          var iCnt = fs.readFileSync(iPath).toString();
          var rCnt = iCnt;
          var selfFn = this;

          // url format
          rCnt = selfFn.resolveUrl(rCnt, iPath, op);

          Object.keys(revMap).forEach((key) => {
            rCnt = rCnt.split(key).join(revMap[key]);
          });

          if (iCnt != rCnt) {
            selfFn.mark.add('update', iPath);
            fs.writeFileSync(iPath, rCnt);
          }
        },
        buildRevMapDestFiles: function(revMap) {
          var config = util.getConfigCacheSync();
          var selfFn = this;
          if (!config) {
            return;
          }
          Object.keys(revMap).forEach((iPath) => {
            var revSrc = util.joinFormat(config.alias.revRoot, iPath);
            var revDest = util.joinFormat(config.alias.revRoot, revMap[iPath]);

            if (!fs.existsSync(revSrc)) {
              return;
            }

            selfFn.mark.add(fs.existsSync(revDest)? 'update': 'create', revDest);
            fs.writeFileSync(revDest, fs.readFileSync(revSrc));
          });
        }
      },
      // 文件名称
      filename: 'rev-manifest.json',
      // rev-build 入口
      build: function(op) {
        return new Promise((next, err) => {
          const config = util.getConfigSync(op);
          const self = this;
          const selfFn = self.fn;
          if (!config) {
            return err('rev-build run fail', 'config not exist');
          }

          if (!config.commit.revAddr) {
            log('msg', 'warn', 'config.commit.revAddr not set, rev task not run');
            return next();
          }

          // 如果是 remote 直接执行 rev-update
          if (op.ver) {
            log('msg', 'info', 'ver is not blank, run rev-update');
            return supercall.rev.update(op).then(() => {
              next();
            });
          }

          // 清除 dest 目录下所有带 hash 文件
          supercall.rev.clean(op).then(() => {
            const htmlFiles = [];
            const jsFiles = [];
            const cssFiles = [];
            const resourceFiles = [];

            util.readFilesSync(config.alias.root, (iPath) => {
              let r;
              const iExt = path.extname(iPath);
              if (/\.(html|json)/.test(iExt)) {
                r = false;
              } else {
                r = true;
              }

              switch (iExt) {
                case '.css':
                  cssFiles.push(iPath);
                  break;

                case '.js':
                  jsFiles.push(iPath);
                  break;

                case '.html':
                  htmlFiles.push(iPath);
                  break;

                default:
                  if (r) {
                    resourceFiles.push(iPath);
                  }
                  break;
              }
              return r;
            });

            // 生成 hash 列表
            const revMap = {};
            // 重置 mark
            selfFn.mark.reset();

            // 生成 资源 hash 表
            resourceFiles.forEach((iPath) => {
              selfFn.buildHashMap(iPath, revMap);
            });

            // 生成 js hash 表
            jsFiles.forEach((iPath) => {
              selfFn.buildHashMap(iPath, revMap);
            });

            // css 文件内路径替换 并且生成 hash 表
            cssFiles.forEach((iPath) => {
              // hash路径替换
              selfFn.fileHashPathUpdate(iPath, revMap, op);
              // 生成hash 表
              selfFn.buildHashMap(iPath, revMap);
            });

            // html 路径替换
            htmlFiles.forEach((iPath) => {
              selfFn.fileHashPathUpdate(iPath, revMap, op);
            });

            // 根据hash 表生成对应的文件
            selfFn.buildRevMapDestFiles(revMap);

            // 版本生成
            revMap.version = util.makeCssJsDate();

            // rev-manifest.json 生成
            util.mkdirSync(config.alias.revDest);
            const revPath = util.joinFormat(config.alias.revDest, supercall.rev.filename);
            const revVerPath = util.joinFormat(
              config.alias.revDest,
              supercall.rev.filename.replace(/(\.\w+$)/g, `-${  revMap.version  }$1`)
            );

            fs.writeFileSync(revPath, JSON.stringify(revMap, null, 4));
            selfFn.mark.add('create', revPath);

            // rev-manifest-{cssjsdate}.json 生成
            fs.writeFileSync(revVerPath, JSON.stringify(revMap, null, 4));
            selfFn.mark.add('create', revVerPath);

            selfFn.mark.print();
            log('msg', 'success', 'rev-build finished');
            next();
          });
        });
      },
      // rev-update 入口
      update: function(op) {
        return new Promise((NEXT, err) => {
          var self = this;
          var selfFn = self.fn;
          var config = util.getConfigSync(op);
          if (!config) {
            return err('rev-update run fail', 'config not exist');
          }
          if (!config.commit.revAddr) {
            log('msg', 'warn', 'config.commit.revAddr not set, rev task not run');
            return NEXT();
          }

          // 重置 mark
          selfFn.mark.reset();

          new util.Promise(((next) => { // 获取 rev-manifest
            if (op.ver == 'remote') { // 远程获取 rev-manifest
              if (config.commit.revAddr) {
                log('msg', 'info', `get remote rev start: ${config.commit.revAddr}`);
                var requestUrl = config.commit.revAddr;
                requestUrl += `${~config.commit.revAddr.indexOf('?')? '&': '?'  }_=${  +new Date()}`;
                util.get(requestUrl, (content) => {
                  var iCnt;
                  try {
                    iCnt = JSON.parse(content.toString());
                    log('msg', 'success', 'get remote finished');
                  } catch (er) {
                    log('msg', 'warn', ['get remote rev fail'], er);
                  }
                  next(iCnt);
                });
              } else {
                log('msg', 'warn', 'get remote rev fail, config.commit.revAddr is null');
                next(null);
              }
            } else {
              next(null);
            }
          })).then((revMap, next) => { // 获取本地 rev-manifest
            if (revMap) {
              return next(revMap);
            }
            var localRevPath = util.joinFormat(
              config.alias.revDest,
              supercall.rev.filename
            );

            if (fs.existsSync(localRevPath)) {
              try {
                revMap = JSON.parse(fs.readFileSync(localRevPath).toString());
              } catch (er) {
                log('msg', 'warn', ['local rev file parse fail', er]);
                return err(er);
              }

              next(revMap);
            } else {
              return err(`local rev file not exist: ${localRevPath}`);
            }
          }).then((revMap, next) => { // hash 表内html, css 文件 hash 替换
            // html 替换
            var htmlFiles = util.readFilesSync(config.alias.root, /\.html$/);

            htmlFiles.forEach((iPath) => {
              selfFn.fileHashPathUpdate(iPath, revMap, op);
            });

            // css 替换
            Object.keys(revMap).forEach((iPath) => {
              var filePath = util.joinFormat(config.alias.revRoot, iPath);

              if (fs.existsSync(filePath)) {
                switch (path.extname(filePath)) {
                  case '.css':
                    self.fn.fileHashPathUpdate(filePath, revMap, op);
                    break;

                  default:
                    break;
                }
              }
            });

            next(revMap);
          }).then((revMap, next) => { // hash对应文件生成
            selfFn.buildRevMapDestFiles(revMap);
            next(revMap);
          }).then((revMap) => { // 本地 rev-manifest 更新
            var localRevPath = util.joinFormat(
              config.alias.revDest,
              supercall.rev.filename
            );
            var localRevData;
            var revContent = JSON.stringify(revMap, null, 4);

            if (fs.existsSync(localRevPath)) {
              localRevData = fs.readFileSync(localRevPath).toString();

              if (localRevData != revContent) {
                fs.writeFileSync(localRevPath, revContent);
                selfFn.mark.add('update', localRevPath);
              }
            } else {
              util.mkdirSync(config.alias.revDest);
              fs.writeFileSync(localRevPath, revContent);
              selfFn.mark.add('create', localRevPath);
            }

            selfFn.mark.print();
            log('msg', 'success', 'rev-update finished');
            NEXT();
          }).start();
        });
      },
      // rev-clean 入口
      clean: function(op) {
        return new Promise((next, err) => {
          var config = util.getConfigSync(op);
          if (!config) {
            return err('rev-clean run fail, config not exist');
          }

          var files = util.readFilesSync(config.alias.root);
          files.forEach((iPath) => {
            if (
              /-[a-zA-Z0-9]{10}\.?\w*\.\w+$/.test(iPath) &&
                fs.existsSync(iPath.replace(/-[a-zA-Z0-9]{10}(\.?\w*\.\w+$)/, '$1'))
            ) {
              try {
                fs.unlinkSync(iPath);
                log('msg', 'del', iPath);
              } catch (er) {
                log('msg', 'warn', `delete file fail: ${iPath}`);
              }
            }
          });
          log('msg', 'success', 'rev-clean finished');
          next();
        });
      }
    },
    // 清除 dest 目录文件
    cleanDest: function(op) {
      return new Promise((next, err) => {
        const config = util.getConfigSync(op);
        util.removeFiles(config.alias.destRoot, (er) => {
          if (er) {
            return err(er);
          }
          log('msg', 'success', 'clear-dest finished');
          next();
        });
      });
    },
    // resource 文件 配置（自定义 复制 src 某文件到 dest 下面）
    resource: function(op) {
      return new Promise((next, err) => {
        const config = util.getConfigSync(op);

        util.copyFiles(config.resource, (er) => {
          if (er) {
            return err(er);
          }
          next();
        });
      });
    },

    livereload: function() {
      return new Promise((next) => {
        util.livereload();
        next();
      });
    },

    // log
    log: function(param) {
      const iArgv = JSON.parse(querystring.unescape(param));
      log(iArgv[0], iArgv[1], iArgv[2]);
    },

    // yyl 脚本调用入口
    run: function() {
      var iArgv = util.makeArray(arguments);
      var ctx = iArgv[1];

      var op = util.envParse(iArgv.slice(1));

      switch (ctx) {
        case 'watch-done':
        case 'watchDone':
          supercall.watchDone(op)
            .catch((er) => {
              log('msg', 'error', er);
            });
          break;

        case 'concat':
          supercall.concat(op)
            .catch((er) => {
              log('msg', 'error', er);
            });
          break;

        case 'concat-css':
          supercall.concatCss(op)
            .catch((er) => {
              log('msg', 'error', er);
            });
          break;

        case 'concat-js':
          supercall.concatJs(op)
            .catch((er) => {
              log('msg', 'error', er);
            });
          break;

        case 'rev-build':
          supercall.rev.build(op)
            .catch((er) => {
              log('msg', 'error', er);
            });
          break;

        case 'rev-update':
          supercall.rev.update(op)
            .catch((er) => {
              log('msg', 'error', er);
            });
          break;

        case 'clean-dest':
          supercall.cleanDest(op)
            .catch((er) => {
              log('msg', 'error', er);
            });
          break;

        case 'rev-clean':
          supercall.rev.clean(op)
            .catch((er) => {
              log('msg', 'error', er);
            });
          break;

        case 'resource':
          supercall.resource(op)
            .catch((er) => {
              log('msg', 'error', er);
            });
          break;

        case 'log':
          supercall.log(op.param)
            .catch((er) => {
              log('msg', 'error', er);
            });
          break;

        case 'livereload':
          supercall.livereload(op)
            .catch((er) => {
              log('msg', 'error', er);
            });
          break;

        default:
          return;
      }
    }

  };

module.exports = supercall;
