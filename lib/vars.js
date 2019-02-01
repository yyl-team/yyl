const util = require('yyl-util');
const extOs = require('yyl-os');

const USERPROFILE = process.env[process.platform == 'win32'? 'USERPROFILE': 'HOME'];
const vars = {
  init(cwd) {
    const iCwd = cwd || process.cwd();

    Object.assign(vars, {
      // 本程序根目录
      BASE_PATH: util.path.join(__dirname, '..'),

      // init path
      INIT_PATH: util.path.join(__dirname, '../init'),

      IS_WINDOWS: process.platform == 'win32',

      // svn rev 文件保留多少个版本
      REV_KEEP_COUNT: 3,
      // 当前cmd 所在地址
      PROJECT_PATH: util.path.join(iCwd),

      // 搜索用 common 目录路径匹配
      COMMIN_PATH_LIKE: 'public/global',
      // COMMIN_PATH_LIKE: 'common/pc',

      // 用户设置文件地址
      USER_CONFIG_FILE: util.path.join(iCwd, 'config.js'),

      // 用户 package.json 地址
      USER_PKG_FILE: util.path.join(iCwd, 'package.json'),

      // server 根目录
      SERVER_PATH: util.path.join(USERPROFILE, '.yyl'),

      // server 数据存放目录
      SERVER_DATA_PATH: util.path.join(USERPROFILE, '.yyl/data'),

      // server plugins 存放目录
      SERVER_PLUGIN_PATH: util.path.join(USERPROFILE, '.yyl/plugins'),

      // server proxy mapping 存放地址
      SERVER_PROXY_MAPPING_FILE: util.path.join(USERPROFILE, '.yyl/data/proxy-mapping.js'),

      // server 存放构建生成的 config 的缓存文件
      SERVER_CONFIG_LOG_PATH: util.path.join(USERPROFILE, '.yyl/config-log'),

      // 本机 ip地址
      LOCAL_SERVER: extOs.LOCAL_IP
    });
    return vars;
  }
};

vars.init();

module.exports = vars;
