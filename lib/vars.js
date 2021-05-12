const util = require('yyl-util')

const USERPROFILE =
  process.env[process.platform == 'win32' ? 'USERPROFILE' : 'HOME']

const vars = {
  // 本程序根目录
  BASE_PATH: util.path.join(__dirname, '..'),

  // server 根目录
  SERVER_PATH: util.path.join(USERPROFILE, '.yyl'),

  // server 数据存放目录
  SERVER_DATA_PATH: util.path.join(USERPROFILE, '.yyl/data'),

  // server plugins 存放目录
  SERVER_PLUGIN_PATH: util.path.join(USERPROFILE, '.yyl/plugins'),

  // server 存放构建生成的 config 的缓存文件
  SERVER_CONFIG_LOG_PATH: util.path.join(USERPROFILE, '.yyl/config-log'),

  // proxy 缓存目录
  PROXY_CACHE_PATH: util.path.join(USERPROFILE, '.anyproxy/cache')
}

module.exports = vars
