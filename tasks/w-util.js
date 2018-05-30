/* no-const-assign: 0 */
'use strict';
const util = require('yyl-util');
const os = require('os');
const path = require('path');
const fs = require('fs');
const querystring = require('querystring');

const USERPROFILE = process.env[process.platform == 'win32'? 'USERPROFILE': 'HOME'];
const cache = {};
const CWD = process.cwd();

const rUtil = util.extend(true, util, {
  REG: {
    HTML_PATH_REG: /(src|href|data-main|data-original)(\s*=\s*)(['"])([^'"]*)(["'])/ig,
    HTML_SCRIPT_REG: /(<script[^>]*>)([\w\W]*?)(<\/script>)/ig,
    HTML_IGNORE_REG: /^(about:|data:|javascript:|#|\{\{)/,
    HTML_SCRIPT_TEMPLATE_REG: /type\s*=\s*['"]text\/html["']/,
    HTML_ALIAS_REG: /^(\{\$)(\w+)(\})/g,
    HTML_IS_ABSLUTE: /^\//,

    HTML_STYLE_REG: /(<style[^>]*>)([\w\W]*?)(<\/style>)/ig,
    HTML_SRC_COMPONENT_JS_REG: /^\.\.\/components\/[pt]-[a-zA-Z0-9-]+\/[pt]-([a-zA-Z0-9-]+).js/g,

    HTML_SRC_COMPONENT_IMG_REG: /^\.\.\/(components\/[pwrt]-[a-zA-Z0-9-]+\/images)/g,

    CSS_PATH_REG: /(url\s*\(['"]?)([^'"]*?)(['"]?\s*\))/ig,
    CSS_PATH_REG2: /(src\s*=\s*['"])([^'" ]*?)(['"])/ig,
    CSS_IGNORE_REG: /^(about:|data:|javascript:|#|\{\{)/,
    CSS_IS_ABSLURE: /^\//,

    JS_DISABLE_AMD: /\/\*\s*amd\s*:\s*disabled\s*\*\//,
    JS_EXCLUDE: /\/\*\s*exclude\s*:([^*]+)\*\//g,
    JS_SUGAR__URL: /__url\(\s*['"]([^'"]*)["']\s*\)/g,

    IS_HTTP: /^(http[s]?:)|(\/\/\w)/,

    IS_MAIN_REMOTE: /\.(html|tpl|svga)$/
  },
  vars: {
    // 本程序根目录
    BASE_PATH: path.join(__dirname, '..'),

    // init-files path
    INIT_FILE_PATH: path.join(__dirname, '../init-files'),

    IS_WINDOWS: process.platform == 'win32',

    // svn rev 文件保留多少个版本
    REV_KEEP_COUNT: 3,
    // 当前cmd 所在地址
    PROJECT_PATH: util.joinFormat(CWD),

    // 搜索用 common 目录路径匹配
    COMMIN_PATH_LIKE: 'public/global',
    // COMMIN_PATH_LIKE: 'common/pc',

    // 用户设置文件地址
    USER_CONFIG_FILE: util.joinFormat(CWD, 'config.js'),

    // 用户 package.json 地址
    USER_PKG_FILE: util.joinFormat(CWD, 'package.json'),

    // server 根目录
    SERVER_PATH: util.joinFormat(USERPROFILE, '.yyl'),

    // server 工作流目录
    SERVER_WORKFLOW_PATH: util.joinFormat(USERPROFILE, '.yyl/init-files'),
    // server lib 目录
    SERVER_LIB_PATH: util.joinFormat(USERPROFILE, '.yyl/lib'),

    // server 数据存放目录
    SERVER_DATA_PATH: util.joinFormat(USERPROFILE, '.yyl/data'),

    // server 存放 更新程序目录
    SERVER_UPDATE_PATH: util.joinFormat(USERPROFILE, '.yyl/update/yyl'),

    // 本机 ip地址
    LOCAL_SERVER: (function() {
      var ipObj = os.networkInterfaces();
      var ipArr;
      for (var key in ipObj) {
        if (ipObj.hasOwnProperty(key)) {
          ipArr = ipObj[key];
          for (var fip, i = 0, len = ipArr.length; i < len; i++) {
            fip = ipArr[i];
            if (fip.family.toLowerCase() == 'ipv4' && !fip.internal) {
              return fip.address;
            }
          }
        }
      }
      return '127.0.0.1';
    })()

  },
  livereload: function() {
    var reloadPath = `http://${  util.vars.LOCAL_SERVER  }:35729/changed?files=1`;
    util.get(reloadPath);
  },

  initConfig: function(config) {
    var ctxRender = function(ctx, vars) {
      vars = vars || {};
      ctx = util.joinFormat(ctx.replace(/\{\$([a-zA-Z0-9_\-.]+)\}/g, (str, $1) => {
        return vars[$1] || '';
      }));
      return ctx;
    };
    var iForEach = function(arr, vars) {
      for (var i = 0, len = arr.length; i < len; i++) {
        switch (util.type(arr[i])) {
          case 'array':
            arr[i] = iForEach(arr[i], vars);
            break;

          case 'string':
            arr[i] = ctxRender(arr[i], vars);
            break;

          case 'object':
            if (arr[i] !== null) {
              arr[i] = deep(arr[i], vars);
            }
            break;
          case 'function':
            break;

          default:
            break;
        }
      }
      return arr;
    };
    var deep = function(obj, vars) {
      var newKey;
      for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
          switch (util.type(obj[key])) {
            case 'array':
              newKey = ctxRender(key, vars);
              if (newKey != key) {
                obj[newKey] = iForEach(obj[key], vars);
                delete obj[key];
              } else {
                obj[key] = iForEach(obj[key], vars);
              }
              break;

            case 'object':
              newKey = ctxRender(key, vars);
              if (newKey != key) {
                obj[newKey] = deep(obj[key], vars);
                delete obj[key];
              } else {
                obj[key] = deep(obj[key], vars);
              }
              break;

            case 'string':
              obj[key] = ctxRender(obj[key], vars);
              break;

            case 'function':
              break;

            default:
              break;
          }
        }
      }
      return obj;
    };

    // 判断是单个 config 还是 多项目 config
    var useful = false;
    if (!config.alias && !config.localserver) {
      for (var key in config) {
        if (util.type(config[key]) == 'object' && config[key].alias && config[key].localserver) {
          config[key] = deep(config[key], config[key].alias);
          useful = true;
        }
      }
    } else if (config.alias && config.localserver) {
      config = deep(config, config.alias);
      useful = true;
    }


    if (!useful) {
      util.msg.error('useness config file', 'please check');
      process.exit();
    }
    return config;
  },
  // 获取 项目config
  getConfigSync: function(op) {
    var userConfigPath = util.vars.USER_CONFIG_FILE;
    var userConfig;
    var iConfig;
    if (!fs.existsSync(userConfigPath)) {
      util.msg.warn('getConfig fail', `file is not exists: ${userConfigPath}`);
      cache.config = null;
      return false;
    }

    try {
      userConfig = util.requireJs(userConfigPath);
    } catch (er) {
      util.msg.warn('getConfig fail', `require(${userConfigPath}) parse fail`);
      cache.config = null;
      return false;
    }

    if (op.name) {
      userConfig = userConfig[op.name];
      if (!userConfig) {
        util.msg.warn('getConfig fail', `userConfig[${ op.name }] is null`);
        cache.config = null;
        return false;
      }
    }

    if (!userConfig.workflow) {
      util.msg.warn('getConfig fail', 'config.workflow is not exists', serverConfigPath);
      cache.config = null;
      return false;
    }

    var serverConfigPath = path.join(util.vars.SERVER_WORKFLOW_PATH, userConfig.workflow, 'config.js');

    if (!fs.existsSync(serverConfigPath)) {
      util.msg.warn('getConfig fail', 'serverConfigPath is not exists:', serverConfigPath);
      cache.config = null;
      return false;
    }

    iConfig = util.requireJs(serverConfigPath);
    cache.config = util.initConfig(iConfig);
    return cache.config;
  },
  // 获取当前运行task 中的 config
  getConfigCacheSync: function() {
    return cache.config;
  },

  // 输出 log 用路径
  printIt: function(iPath) {
    var config = util.getConfigCacheSync();
    if (!config) {
      return iPath;
    }
    return path.relative(config.alias.dirname, iPath);
  }
});

rUtil.printIt.init = function(config) {
  cache.config = config;
};


rUtil.msg.init({
  maxSize: 8,
  type: {
    rev: {name: 'rev', color: '#ffdd00'},
    concat: {name: 'Concat', color: 'cyan'},
    update: {name: 'Updated', color: 'cyan'},
    proxyTo: {name: 'Proxy =>', color: 'gray'},
    proxyBack: {name: 'Proxy <=', color: 'cyan'},
    supercall: {name: 'Supercal', color: 'magenta'},
    optimize: {name: 'Optimize', color: 'green'},
    cmd: {name: 'CMD', color: 'gray'}
  }
});


// 路径匹配三巨头(噗)
rUtil.htmlPathMatch = function (ctx, replaceHandle) {
  let content = ctx;

  // 提取 script 标签
  content = content
    .replace(util.REG.HTML_SCRIPT_REG, (str, $1, $2, $3) => {
      // tpl 不作处理
      if ($1.match(util.REG.HTML_SCRIPT_TEMPLATE_REG)) {
        return str;

      // 处理 url 部分 并且隔离 script
      } else {
        return `${$1}${querystring.escape(rUtil.jsPathMatch($2, replaceHandle))}${$3}`;
      }
    })
    // 隔离 style 标签
    .replace(util.REG.HTML_STYLE_REG, (str, $1, $2, $3) => {
      return $1 + querystring.escape(util.cssPathMatch($2, replaceHandle)) + $3;
    })
    // 匹配 html 中的 url
    .replace(util.REG.HTML_PATH_REG, (str, $1, $2, $3, $4, $5) => {
      const iPath = replaceHandle($4, 'html-path');
      return `${$1}${$2}${$3}${iPath}${$5}`;
    })
    // 取消隔离 script 内容
    .replace(util.REG.HTML_SCRIPT_REG, (str, $1, $2, $3) => {
      if ($1.match(util.REG.HTML_SCRIPT_TEMPLATE_REG)) {
        return str;
      } else {
        return $1 + querystring.unescape($2) + $3;
      }
    })
    // 取消隔离 style 标签
    .replace(util.REG.HTML_STYLE_REG, (str, $1, $2, $3) => {
      return $1 + querystring.unescape($2) + $3;
    });

  return content;
};

rUtil.jsPathMatch = function (ctx, replaceHandle) {
  let scriptCnt = ctx;
  scriptCnt = scriptCnt.replace(util.REG.JS_SUGAR__URL, (str, $1) => {
    return replaceHandle($1, '__url');
  });
  return scriptCnt;
};
rUtil.cssPathMatch = function (ctx, replaceHandle) {
  let cssCnt = ctx;
  const handle = (str, $1, $2, $3) => {
    return `${$1}${replaceHandle($2, 'css-path')}${$3}`;
  };
  cssCnt = cssCnt
    .replace(util.REG.CSS_PATH_REG, handle)
    .replace(util.REG.CSS_PATH_REG2, handle);

  return cssCnt;
};

module.exports = rUtil;
