/* elint indent: [ "warn", 2 , {"SwitchCase": 1}] */
/* eslint no-unused-vars: "none" */
const path = require('path');
const config = {};

// + vars
const PROJECT_NAME = __data('name');
const WORKFLOW = __data('workflow');
const PLATFORM = __data('platform');
const VERSION = __data('version');
const SRC_ROOT = __data('srcRoot');
const COMMON_PATH = __data('commonPath');
// - vars

const setting = {};

// + base
Object.assign(config, {
  workflow: WORKFLOW,
  name: PROJECT_NAME,
  version: VERSION,
  platform: PLATFORM,
  proxy: setting.proxy,
  localserver: setting.localserver,
  dest: setting.dest,
  commit: {},

  concat: { // js 合并
    // '{$jsDest}/vendors.js': ['{$srcRoot}/js/lib/a.js', '{$srcRoot}/js/lib/b.js']
  },
  resource: { // 自定义项目中其他需打包的文件夹
    // 'src/pc/svga': path.join(setting.localserver.root, setting.dest.basePath, 'tpl')
  },
  plugins: [ // 额外的 npm 组件
    // 'yyl-flexlayout'
  ],
  /**
   * 初始化 config 时 对config的二次操作
   * @param {object}   config          服务器初始化完成的 config 对象
   * @param {object}   env             命令行接收到的 参数
   * @param {function} next(newconfig) 返回给服务器继续处理用的 next 函数
   * @param {object}   newconfig       处理后的 config
   */
  onInitConfig(config, env, next) {
    next(config);
  },
  /**
   * 触发提交 svn 前中间件函数
   * @param {String}   sub    命令行 --sub 变量
   * @param {Function} next() 下一步
   */
  onBeforeCommit(type, next) {
    next();
  },
});
// - base



module.exports = config;
