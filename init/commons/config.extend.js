/* elint indent: [ "warn", 2 , {"SwitchCase": 1}] */
/* eslint no-unused-vars: 0 */
const path = require('path');

// + vars
const PROJECT_NAME = __data('name');
const WORKFLOW = __data('workflow');
const PLATFORM = __data('platform');
const VERSION = __data('version');
const SRC_ROOT = __data('srcRoot');
const COMMON_PATH = __data('commonPath');
const WEBPACK_CONFIG_PATH = __data('webpackConfigPath');
// - vars

const setting = {};

const config = {
  // + configBase
  workflow: WORKFLOW,
  name: PROJECT_NAME,
  version: VERSION,
  platform: PLATFORM,
  proxy: setting.proxy,
  // - configBase
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
  ]
  // 自定义 webpack.config 路径
};


module.exports = config;
