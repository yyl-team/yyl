const util = require('yyl-util')

const USERPROFILE =
  process.env[process.platform == 'win32' ? 'USERPROFILE' : 'HOME']

module.exports = {
  // 本程序根目录
  BASE_PATH: util.path.join(__dirname, '..'),

  // server 根目录
  SERVER_PATH: util.path.join(USERPROFILE, '.yyl'),

  // server seed 目录
  SERVER_SEED_PATH: util.path.join(USERPROFILE, '.yyl/seeds'),

  // proxy 缓存目录
  PROXY_CACHE_PATH: util.path.join(USERPROFILE, '.anyproxy/cache')
}
