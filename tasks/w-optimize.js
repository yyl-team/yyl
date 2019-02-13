'use strict';
const fs = require('fs');
const chalk = require('chalk');
const path = require('path');
const extFs = require('yyl-fs');
const Concat = require('concat-with-sourcemaps');
const revHash = require('rev-hash');
const frp = require('yyl-file-replacer');
const request = require('yyl-request');
const util = require('yyl-util');
const extOs = require('yyl-os');

const extFn = require('../lib/extFn.js');
const vars = require('../lib/vars.js');
const log = require('../lib/log.js');

const wServer = require('./w-server.js');
const wProxy = require('./w-proxy.js');
const SEED = require('./w-seed.js');
const PKG = require('../package.json');

const wOpzer = async function (ctx, iEnv, configPath) {
  // env format
  if (iEnv.ver == 'remote') {
    iEnv.remote = true;
  }
  if (iEnv.remote) {
    iEnv.ver = 'remote';
  }

  log('msg', 'info', 'parse config start');

  // init config
  let config = null;
  try {
    config = await extFn.parseConfig(configPath, iEnv);
  } catch (er) {
    throw `yyl ${ctx} ${util.envStringify(iEnv)} error, ${er}`;
  }

  wOpzer.saveConfigToServer(config);

  // 版本检查
  if (util.compareVersion(config.version, PKG.version) > 0) {
    throw `optimize fail, project required yyl at least ${config.version}`;
  }

  const seed = SEED.find(config);
  if (!seed) {
    throw `optimize fail, config.workflow (${config.workflow}) is not in yyl seed, usage: ${Object.keys[SEED]}`;
  }

  const opzer = seed.optimize(config, path.dirname(configPath));

  // handle exists check
  if (!opzer[ctx] || util.type(opzer[ctx]) !== 'function') {
    throw `optimize fail handle [${ctx}] is not exists`;
  }

  // package check
  try {
    await wOpzer.initPlugins(config);
  } catch (er) {
    throw `optimize fail, plugins install error: ${er.message}`;
  }

  // clean dist
  await extFs.removeFiles(config.localserver.root);

  // find usage localserver port
  await util.makeAwait((next) => {
    let iPort = config.localserver.port;
    const checkPort = function (canUse) {
      if (canUse) {
        config.localserver.port = iPort;
        next(config, opzer);
      } else {
        iPort = config.localserver.port + Math.round(Math.random() * 1000);
        extOs.checkPort(iPort).then(checkPort);
      }
    };

    extOs.checkPort(iPort).then(checkPort);
  });

  if (ctx === 'watch') {
    const op = {
      livereload: opzer.ignoreLiveReload && !iEnv.livereload ? false: true
    };

    // 接入 seed 中间件
    if (opzer.initServerMiddleWare) {
      op.onInitMiddleWare = function (app, port) {
        opzer.initServerMiddleWare(app, iEnv, port);
      };
    }

    let afterConfig = await wServer.start(config, iEnv, op);
    if (afterConfig) {
      config = afterConfig;
    }

    // proxy server
    if (iEnv.proxy) {
      let porxyPort = 8887;
      if (config.proxy && config.proxy.port) {
        porxyPort = config.proxy.port;
      }

      if (config.proxy && config.proxy.https) {
        iEnv.https = true;
      }

      const canUse = await extOs.checkPort(porxyPort);
      if (canUse) {
        let cmd = `yyl proxy start --silent ${util.envStringify(iEnv)}`;
        await extOs.runCMD(cmd, vars.PROJECT_PATH, true, true);
      } else {
        log('msg', 'warn', `proxy server start fail, ${chalk.yellow.bold('8887')} was occupied`);
      }
    }
  }

  // optimize
  return await util.makeAwait((next) => {
    let isUpdate = 0;
    let isError = false;
    opzer[ctx](iEnv)
      .on('start', () => {
        if (isUpdate) {
          log('clear');
          log('start', 'optimize');
        }
      })
      .on('msg', (type, argv) => {
        log('msg', type, argv);
        if (type === 'error') {
          isError = true;
        }
      })
      .on('finished', async () => {
        if (ctx === 'all' && isError) {
          throw `${ctx} task run error`;
        }
        log('msg', 'success', [`opzer.${ctx}() finished`]);

        await wOpzer.afterTask(config, iEnv, isUpdate);

        // 更新 映射表
        if (iEnv.proxy) {
          await wProxy.updateMapping(config, iEnv);
        }

        // 第一次构建 打开 对应页面
        if (ctx === 'watch' && !isUpdate && !iEnv.silent && iEnv.proxy) {
          await wOpzer.openHomePage(config, iEnv);
        }

        if (isUpdate) {
          // 刷新页面
          if (!opzer.ignoreLiveReload || iEnv.livereload) {
            log('msg', 'success', 'page reloaded');
            await wOpzer.livereload(config, iEnv);
          }
          log('finished');
        } else {
          isUpdate = 1;
          log('finished');
          next(config, opzer);
        }
      });
  });
};

wOpzer.afterTask = async function (config, iEnv, isUpdate) {
  await wOpzer.resource(config, iEnv);
  await wOpzer.concat(config, iEnv);
  await wOpzer.varSugar(config, iEnv);

  if (isUpdate) {
    await wOpzer.rev.update(config, iEnv);
  } else {
    iEnv.revIgnore = /async_component/;
    await wOpzer.rev.build(config, iEnv);
  }
};

// var sugar
wOpzer.varSugar = async function (config, iEnv) {
  const varObj = util.extend({}, config.alias);
  let mainPrefix = '/';
  let staticPrefix = '/';
  let root = varObj.destRoot;

  if (iEnv.remote || iEnv.isCommit) {
    mainPrefix = config.commit.mainHost || config.commit.hostname || '/';
    staticPrefix = config.commit.staticHost || config.commit.hostname || '/';
  }

  Object.keys(varObj).forEach((key) => {
    let iPrefix = '';
    if (varObj[key].match(frp.IS_MAIN_REMOTE)) {
      iPrefix = mainPrefix;
    } else {
      iPrefix = staticPrefix;
    }
    varObj[key] = util.path.join(
      iPrefix,
      path.relative(root, varObj[key])
    );
  });

  const htmls = await extFs.readFilePaths(config.destRoot, /\.html$/, true);

  htmls.forEach((iPath) => {
    let iCnt = fs.readFileSync(iPath).toString();
    iCnt = frp.htmlPathMatch(iCnt, (rPath) => {
      return extFn.sugarReplace(rPath, varObj);
    });
    fs.writeFileSync(iPath, iCnt);
  });
};

// concat 操作
wOpzer.concat = async function (config) {
  if (config.concat) {
    log('msg', 'info', 'concat start');
    const keys = Object.keys(config.concat);
    if (keys.length) {
      await util.forEach(keys, async (dest) => {
        const srcs = config.concat[dest];
        const concat = new Concat(false, dest, '\n');

        srcs.forEach((item) => {
          if (!fs.existsSync(item)) {
            log('msg', 'warn', `${item} is not exists, break`);
            return;
          }

          if (path.extname(item) == '.js') {
            concat.add(null, `;/* ${path.basename(item)} */`);
          } else {
            concat.add(null, `/* ${path.basename(item)} */`);
          }
          concat.add(item, fs.readFileSync(item));
        });

        await extFs.mkdirSync(path.dirname(dest));
        fs.writeFileSync(dest, concat.content);
        log('msg', 'concat', [dest].concat(srcs));
      });
    } else {
      log('msg', 'success', 'concat finished, no concat setting');
    }
  } else {
    log('msg', 'info', 'config.concat is not defined, break');
  }
};

// resouce 操作
wOpzer.resource = async function (config) {
  if (config.resource) {
    const data = await extFs.copyFiles(config.resource);
    data.add.forEach((iPath) => {
      log('msg', 'create', iPath);
    });

    data.update.forEach((iPath) => {
      log('msg', 'update', iPath);
    });
  } else {
    log('msg', 'info', 'config.resource is not defined, break');
  }
};

wOpzer.rev = {
  use(config) {
    wOpzer.rev.cache.config = config;
  },
  getConfigSync() {
    return wOpzer.rev.cache.config;
  },
  cache: {
    config: null
  },
  fn: {
    mark: {
      source: {
        create: [],
        update: [],
        other: []
      },
      add: function(type, iPath) {
        const self = this;
        self.source[type in self.source? type: 'other'].push(iPath);
      },
      reset: function() {
        const self = this;
        Object.keys(self.source).forEach((key) => {
          self.source[key] = [];
        });
      },
      print: function() {
        const source = this.source;
        log('msg', 'rev', [
          chalk.green('create: ') + chalk.yellow(source.create.length),
          chalk.cyan('update: ') + chalk.yellow(source.update.length),
          chalk.gray('other: ') + chalk.yellow(source.other.length)
        ].join(', '));
      }
    },

    // 路径纠正
    resolveUrl: function(cnt, filePath, revMap, op) {
      const iExt = path.extname(filePath).replace(/^\./g, '');
      const iDir = path.dirname(filePath);
      const config = wOpzer.rev.getConfigSync();
      const iHostname = (function() {
        if (op.isCommit || op.ver  == 'remote' || op.proxy) {
          return config.commit.hostname;
        } else {
          return '/';
        }
      })();
      let r = '';
      const revReplace = function(rPath) {
        let rrPath = rPath;
        Object.keys(revMap).forEach((key) => {
          if (key == 'version') {
            return;
          }
          rrPath = rrPath.split(key).join(revMap[key]);
        });
        return rrPath;
      };
      const htmlReplace = function(iCnt) {
        const rCnt = frp.htmlPathMatch(iCnt, (iPath, type) => {
          const r = (rPath) => {
            switch (type) {
              case '__url':
                return `'${revReplace(rPath)}'`;

              default:
                return revReplace(rPath);
            }
          };

          let rPath = iPath;
          if (rPath.match(frp.REG.HTML_IGNORE_REG)) {
            return r(iPath);
          } else if (rPath.match(frp.REG.HTML_ALIAS_REG)) { // 构建语法糖 {$key}
            let isMatch = false;

            rPath = rPath.replace(
              frp.REG.HTML_ALIAS_REG,
              (str, $1, $2) => {
                if (config.alias[$2]) {
                  isMatch = true;
                  return config.alias[$2];
                } else {
                  return '';
                }
              }
            );

            if (isMatch && rPath && fs.existsSync(rPath)) {
              rPath = util.path.join(
                iHostname,
                util.path.relative(config.alias.destRoot, rPath)
              );

              return r(rPath);
            } else {
              return r(iPath);
            }
          } else {
            // url format
            rPath = util.path.join(rPath);

            // url absolute
            if (!rPath.match(frp.REG.IS_HTTP) && !path.isAbsolute(rPath)) {
              rPath = util.path.join(
                iHostname,
                util.path.relative(config.alias.destRoot, iDir),
                rPath
              );
            }
            return r(rPath);
          }
        });

        return rCnt;
      };
      const cssReplace = function(iCnt) {
        const rCnt = frp.cssPathMatch(iCnt, (iPath) => {
          let rPath = iPath;
          if (rPath.match(frp.REG.CSS_IGNORE_REG)) {
            return iPath;
          } else {
            rPath = util.path.join(rPath);
            // url absolute
            if (!rPath.match(frp.REG.IS_HTTP) && !path.isAbsolute(rPath)) {
              rPath = util.path.join(
                op.remotePath ? op.remotePath : config.commit.hostname,
                util.path.relative(config.alias.destRoot, iDir),
                rPath
              );
            }

            return revReplace(rPath);
          }
        });

        return rCnt;
      };
      const jsReplace = function(iCnt) {
        return frp.jsPathMatch(iCnt, (iPath, type) => {
          const r = (rPath) => {
            switch (type) {
              case '__url':
                return `'${revReplace(rPath)}'`;

              default:
                return revReplace(rPath);
            }
          };
          let rPath = iPath;
          if (rPath.match(frp.REG.CSS_IGNORE_REG)) {
            return r(rPath);
          } else {
            rPath = util.path.join(rPath);
            // url absolute
            if (!rPath.match(frp.REG.IS_HTTP) && !path.isAbsolute(rPath)) {
              rPath = util.path.join(
                op.remotePath ? op.remotePath : config.commit.hostname,
                util.path.relative(config.alias.destRoot, iDir),
                rPath
              );
            }

            return r(rPath);
          }
        });
      };
      switch (iExt) {
        case 'html':
        case 'tpl':
          r = htmlReplace(cnt);
          break;

        case 'css':
          r = cssReplace(cnt);
          break;

        case 'js':
          r = jsReplace(cnt);
          break;

        default:
          r = cnt;
          break;
      }

      return r;
    },
    // hash map 生成
    buildHashMap: function(iPath, revMap) {
      const config = wOpzer.rev.getConfigSync();
      const revSrc = util.path.join(path.relative(config.alias.revRoot, iPath));
      const hash = `-${revHash(fs.readFileSync(iPath))}`;
      const revDest = revSrc.replace(/(\.[^.]+$)/g, `${hash}$1`);

      revMap[revSrc] = revDest;
    },
    // 文件 hash 替换
    fileHashPathUpdate: function(iPath, revMap, op) {
      const iCnt = fs.readFileSync(iPath).toString();
      let rCnt = iCnt;
      const selfFn = this;

      // url format
      rCnt = selfFn.resolveUrl(rCnt, iPath, revMap, op);



      if (iCnt != rCnt) {
        selfFn.mark.add('update', iPath);
        fs.writeFileSync(iPath, rCnt);
      }
    },
    buildRevMapDestFiles: function(revMap) {
      const config = wOpzer.rev.getConfigSync();
      const selfFn = this;
      if (!config) {
        return;
      }
      Object.keys(revMap).forEach((iPath) => {
        const revSrc = util.path.join(config.alias.revRoot, iPath);
        const revDest = util.path.join(config.alias.revRoot, revMap[iPath]);

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

  async getRemoteManifest(op) {
    const config = wOpzer.rev.getConfigSync(op);
    let disableHash = false;

    if (config.disableHash) {
      disableHash = true;
    }

    if (!config.commit || !config.commit.revAddr) {
      disableHash = true;
    }

    if (!disableHash) {
      log('msg', 'info', `get remote rev start: ${config.commit.revAddr}`);
      let requestUrl = config.commit.revAddr;
      requestUrl += `${~config.commit.revAddr.indexOf('?')?'&': '?'}_=${+new Date()}`;
      const [error, res, content] = await request({
        url: requestUrl,
        headers: {
          'User-Agent': `Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.67 Safari/537.36 YYL/${PKG.version}`
        }
      });

      let iCnt = undefined;

      if (error) {
        log('msg', 'warn', [`get remote rev fail, ${error.message}`]);
      } else if (res.statusCode !== 200) {
        log('msg', 'warn', [`get remote rev fail, status ${res.statusCode}`]);
      } else {
        try {
          iCnt = JSON.parse(content.toString());
          log('msg', 'success', 'get remote finished');
        } catch (er) {
          log('msg', 'warn', ['get remote rev fail', er]);
        }
      }
      return iCnt;
    } else {
      if (!config.commit.revAddr) {
        log('msg', 'warn', 'get remote rev fail, config.commit.revAddr is null');
      }
    }
    return null;
  },
  // rev-build 入口
  async build(config, op) {
    const self = this;
    const selfFn = self.fn;
    if (!config) {
      throw 'rev-build run fail', 'config not exist';
    }

    self.use(config);

    let disableHash = false;

    if (config.disableHash) {
      disableHash = true;
      log('msg', 'success', 'config.disableHash, rev task ignore');
    }

    if (!config.commit.revAddr) {
      disableHash = true;
      log('msg', 'success', 'config.commit.revAddr not set, rev task ignore');
    }

    if (op.ver) {
      const data = await wOpzer.rev.getRemoteManifest(op);
      if (data) {
        log('msg', 'info', 'ver is not blank, remote url exist, run rev-update');
        await wOpzer.rev.update(config, op, data);
        return;
      }
    }

    // 清除 dest 目录下所有带 hash 文件
    await wOpzer.rev.clean(config, op);

    const htmlFiles = [];
    const jsFiles = [];
    const cssFiles = [];
    const resourceFiles = [];
    const tplFiles = [];

    extFs.readFilesSync(config.alias.root, (iPath) => {
      let r;
      const iExt = path.extname(iPath);

      if (/\.(html|json)/.test(iExt)) {
        r = false;
      } else {
        r = true;
      }

      if (op.revIgnore) {
        if (iPath.match(op.revIgnore)) {
          return r;
        }
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

        case '.tpl':
          tplFiles.push(iPath);
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
    let revMap = {};
    // 重置 mark
    selfFn.mark.reset();

    // 生成 资源 hash 表
    if (!disableHash) {
      resourceFiles.forEach((iPath) => {
        selfFn.buildHashMap(iPath, revMap);
      });
    }

    // 生成 js hash 表
    jsFiles.forEach((iPath) => {
      // hash路径替换
      selfFn.fileHashPathUpdate(iPath, revMap, op);

      if (!disableHash) {
        // 生成hash 表
        selfFn.buildHashMap(iPath, revMap);
      }
    });

    // css 文件内路径替换 并且生成 hash 表
    cssFiles.forEach((iPath) => {
      // hash路径替换
      selfFn.fileHashPathUpdate(iPath, revMap, op);

      if (!disableHash) {
        // 生成hash 表
        selfFn.buildHashMap(iPath, revMap);
      }
    });

    // tpl 文件内路径替换 并且生成 hash 表
    tplFiles.forEach((iPath) => {
      // hash路径替换
      selfFn.fileHashPathUpdate(iPath, revMap, op);

      if (!disableHash) {
        // 生成hash 表
        selfFn.buildHashMap(iPath, revMap);
      }
    });

    // html 路径替换
    htmlFiles.forEach((iPath) => {
      selfFn.fileHashPathUpdate(iPath, revMap, op);
    });


    if (!disableHash) {
      // 根据hash 表生成对应的文件
      selfFn.buildRevMapDestFiles(revMap);

      // 版本生成
      revMap.version = util.makeCssJsDate();

      // rev-manifest.json 生成
      await extFs.mkdirSync(config.alias.revDest);
      const revPath = util.path.join(config.alias.revDest, wOpzer.rev.filename);
      const revVerPath = util.path.join(
        config.alias.revDest,
        wOpzer.rev.filename.replace(/(\.\w+$)/g, `-${revMap.version}$1`)
      );

      // 存在 则合并
      if (fs.existsSync(revPath)) {
        let oRevMap = null;
        try {
          oRevMap = JSON.parse(fs.readFileSync(revPath));
        } catch (er) {
          log('msg', 'warn', 'oRegMap parse error');
        }
        if (oRevMap) {
          revMap = util.extend(true, oRevMap, revMap);
          log('msg', 'success', 'original regMap concat finished');
        }
      }

      fs.writeFileSync(revPath, JSON.stringify(revMap, null, 4));
      selfFn.mark.add('create', revPath);

      // rev-manifest-{cssjsdate}.json 生成
      fs.writeFileSync(revVerPath, JSON.stringify(revMap, null, 4));
      selfFn.mark.add('create', revVerPath);
    }

    selfFn.mark.print();
    log('msg', 'success', 'rev-build finished');
  },
  // rev-update 入口
  async update(config, iEnv, remoteManifestData) {
    const self = this;
    const selfFn = self.fn;
    if (!config) {
      throw 'rev-update run fail', 'config not exist';
    }

    self.use(config);

    let disableHash = false;

    if (config.disableHash) {
      disableHash = true;
      log('msg', 'success', 'config.disableHash, rev task ignore');
    }

    if (!config.commit.revAddr) {
      disableHash = true;
      log('msg', 'success', 'config.commit.revAddr not set, rev task ignore');
    }

    // 重置 mark
    selfFn.mark.reset();

    let revMap = remoteManifestData;

    const localRevPath = util.path.join(
      config.alias.revDest,
      wOpzer.rev.filename
    );

    if (disableHash || !iEnv.remote) {
      revMap = {};
    } else {
      if (!revMap) {
        revMap = await wOpzer.rev.getRemoteManifest(iEnv);
      }
    }
    if (!revMap) {
      if (fs.existsSync(localRevPath)) {
        try {
          revMap = JSON.parse(fs.readFileSync(localRevPath).toString());
        } catch (er) {
          log('msg', 'warn', ['local rev file parse fail', er]);
          throw er;
        }
      } else {
        throw `local rev file not exist: ${chalk.yellow(localRevPath)}`;
      }
    }

    // hash 表内html, css 文件 hash 替换

    // html, tpl 替换
    const htmlFiles = extFs.readFilesSync(config.alias.root, /\.(html|tpl)$/);
    htmlFiles.forEach((iPath) => {
      selfFn.fileHashPathUpdate(iPath, revMap, iEnv);
    });

    // css or js 替换
    if (disableHash) {
      const jsFiles = extFs.readFilesSync(config.alias.root, /\.js$/);
      const cssFiles = extFs.readFilesSync(config.alias.root, /\.css$/);

      jsFiles.forEach((filePath) => {
        self.fn.fileHashPathUpdate(filePath, revMap, iEnv);
      });

      cssFiles.forEach((filePath) => {
        self.fn.fileHashPathUpdate(filePath, revMap, iEnv);
      });
    } else {
      Object.keys(revMap).forEach((iPath) => {
        const filePath = util.path.join(config.alias.revRoot, iPath);

        if (fs.existsSync(filePath)) {
          switch (path.extname(filePath)) {
            case '.css':
              self.fn.fileHashPathUpdate(filePath, revMap, iEnv);
              break;

            case '.js':
              self.fn.fileHashPathUpdate(filePath, revMap, iEnv);
              break;

            default:
              break;
          }
        }
      });
    }

    // hash对应文件生成
    selfFn.buildRevMapDestFiles(revMap);

    // 本地 rev-manifest 更新

    let localRevData;
    const revContent = JSON.stringify(revMap, null, 4);

    if (fs.existsSync(localRevPath)) {
      localRevData = fs.readFileSync(localRevPath).toString();

      if (localRevData != revContent) {
        fs.writeFileSync(localRevPath, revContent);
        selfFn.mark.add('update', localRevPath);
      }
    } else {
      await extFs.mkdirSync(config.alias.revDest);
      fs.writeFileSync(localRevPath, revContent);
      selfFn.mark.add('create', localRevPath);
    }

    selfFn.mark.print();
    log('msg', 'success', 'rev-update finished');
  },
  // rev-clean 入口
  clean: function(config) {
    return new Promise((next, err) => {
      const self = this;
      if (!config) {
        return err('rev-clean run fail, config not exist');
      }

      self.use(config);

      const files = extFs.readFilesSync(config.alias.root);
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
};

// livereload
wOpzer.livereload = async function(config, iEnv)  {
  if (!iEnv.silent && iEnv.proxy) {
    const reloadPath = `http://${vars.LOCAL_SERVER}:${config.localserver.port}1/changed?files=1`;
    await request(reloadPath);
  }
};


// 更新 packages
wOpzer.initPlugins = async function (config) {
  if (!config.plugins || !config.plugins.length) {
    return;
  }
  const iNodeModulePath = config.resolveModule;

  if (!iNodeModulePath) {
    throw 'init plugins fail, config.resolveModule is not set';
  }

  if (!fs.existsSync(iNodeModulePath)) {
    extFs.mkdirSync(iNodeModulePath);
  }
  const installLists = [];

  config.plugins.forEach((str) => {
    let iDir = '';
    let iVer = '';
    const pathArr = str.split(/[\\/]+/);
    let pluginPath = '';
    let pluginName = '';
    if (pathArr.length > 1) {
      pluginName = pathArr.pop();
      pluginPath = pathArr.join('/');
    } else {
      pluginName = pathArr[0];
    }

    if (~pluginName.indexOf('@')) {
      iDir = pluginName.split('@')[0];
      iVer = pluginName.split('@')[1];
    } else {
      iDir = pluginName;
    }
    let iPath = path.join(iNodeModulePath, pluginPath, iDir);
    let iPkgPath = path.join(iPath, 'package.json');
    let iPkg;
    if (fs.existsSync(iPath) && fs.existsSync(iPkgPath)) {
      if (iVer) {
        iPkg = require(iPkgPath);
        if (iPkg.version != iVer) {
          installLists.push(str);
        }
      }
    } else {
      installLists.push(str);
    }
  });

  if (installLists.length) {
    const cmd = `npm install ${installLists.join(' ')} --loglevel http`;
    log('msg', 'info', `run cmd ${cmd}`);
    process.chdir(vars.BASE_PATH);

    log('end');
    await extOs.runCMD(cmd, iNodeModulePath);
  } else {
    return;
  }
};


// open page
wOpzer.openHomePage = async function(config, iEnv) {
  const htmls = await extFs.readFilePaths(config.alias.destRoot, /\.html$/, true);
  let addr;
  const localServerAddr = `http://${vars.LOCAL_SERVER}:${config.localserver.port}`;
  const localServerAddr2 = `http://127.0.0.1:${config.localserver.port}`;
  const iHost = config.commit.hostname.replace(/\/$/, '');

  htmls.sort((a, b) => {
    const aName = path.basename(a);
    const bName = path.basename(b);
    const reg = /^index|default$/;
    const aReg = reg.exec(aName);
    const bReg = reg.exec(bName);

    if (aReg && !bReg) {
      return -1;
    } else if (!aReg && bReg) {
      return 1;
    } else {
      return a.localeCompare(b);
    }
  });

  if (config.proxy && config.proxy.homePage) {
    addr = config.proxy.homePage;
  } else {
    if (iEnv.proxy) {
      let iAddr = '';
      if (config.proxy && config.proxy.localRemote) {
        for (let key in config.proxy.localRemote) {
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

    if (htmls.length) {
      addr = util.path.join(addr, path.relative(config.alias.destRoot, htmls[0]));
    }
  }

  log('msg', 'success', 'open addr:');
  log('msg', 'success', chalk.cyan(addr));
  await extOs.openBrowser(addr);
  return addr;
};


wOpzer.saveConfigToServer = async function (config) {
  if (!config || !config.workflow || !config.name) {
    return;
  }
  await extFs.mkdirSync(vars.SERVER_CONFIG_LOG_PATH);
  const filename = `${config.workflow}-${config.name}.js`;
  const serverConfigPath = path.join(vars.SERVER_CONFIG_LOG_PATH, filename);
  const printPath = `~/.yyl/${path.relative(vars.SERVER_PATH, serverConfigPath)}`;
  fs.writeFileSync(serverConfigPath, JSON.stringify(config, null, 2));
  log('msg', 'success', `config saved ${chalk.yellow(printPath)}`);
};

module.exports = wOpzer;

