const path = require('path')

// + vars
const PROJECT_NAME = 'react-ts'
const WORKFLOW = 'webpack'
const PLATFORM = 'pc'
const VERSION = '3.7.2'
const SRC_ROOT = './src'
// - vars

// + setting
const setting = {
  localserver: { // 本地服务器配置
    root: './dist', // 服务器输出地址
    port: 5000 // 服务器 port
  },
  dest: {
    basePath: `/project/${PROJECT_NAME}/${PLATFORM}`,
    jsPath: 'js',
    jslibPath: 'js/lib',
    cssPath: 'css',
    htmlPath: 'html',
    imagesPath: 'images',
    tplPath: 'tpl',
    revPath: 'assets'
  },
  // 代理服务器
  proxy: {
    port: 8887,
    localRemote: {
      'http://web.yy.com/': 'http://127.0.0.1:5000/',
      'http://webtest.yy.com/': 'http://127.0.0.1:5000/'
    },
    homePage: `http://www.yy.com/web/${PROJECT_NAME}/`
  }
}
setting.proxy.localRemote[`http://www.yy.com/web/${PROJECT_NAME}`] = `http://127.0.0.1:5000/project/${PROJECT_NAME}/${PLATFORM}/html`
setting.proxy.localRemote[`http://web.yy.com/${PROJECT_NAME}`] = `http://127.0.0.1:5000/project/${PROJECT_NAME}/${PLATFORM}/html`
setting.proxy.localRemote[`http://webtest.yy.com/${PROJECT_NAME}`] = `http://127.0.0.1:5000/project/${PROJECT_NAME}/${PLATFORM}/html`
setting.proxy.localRemote['http://www.yy.com/api/mock'] = 'http://127.0.0.1:5000/api/mock'

// - setting

const DEST_BASE_PATH = path.join(setting.localserver.root, setting.dest.basePath)

function makeConfig ({ env }) {
  const config = {
    // + configBase
    workflow: WORKFLOW,
    name: PROJECT_NAME,
    version: VERSION,
    platform: PLATFORM,
    proxy: setting.proxy,
    // - configBase
    seed: 'react-ts',
    px2rem: false,
    ie8: false,
    base64Limit: 3000,
    localserver: setting.localserver,
    dest: setting.dest,
    concat: {
      '{$jsDest}/shim.js': [
        '{$srcRoot}/js/lib/shim/es5-shim.min.js',
        '{$srcRoot}/js/lib/shim/es5-sham.min.js',
        '{$srcRoot}/js/lib/shim/json3.min.js',
        '{$srcRoot}/js/lib/shim/es6-shim.min.js',
        '{$srcRoot}/js/lib/shim/es6-sham.min.js'
      ]
    },
    all: {
      beforeScripts: 'echo "hello all beforescripts"'
    },
    providePlugin: {
      '$': 'jquery'
    },
    alias: {
      // 输出目录中 到 html, js, css, image 层 的路径
      'root': DEST_BASE_PATH,
      // rev 输出内容的相对地址
      'revRoot': DEST_BASE_PATH,
      // dest 地址
      'destRoot': setting.localserver.root,
      // src 地址
      'srcRoot': SRC_ROOT,
      // 项目根目录
      'dirname': './',
      // js 输出地址
      'jsDest': path.join(DEST_BASE_PATH, setting.dest.jsPath),
      // js lib 输出地址
      'jslibDest': path.join(DEST_BASE_PATH, setting.dest.jslibPath),
      // html 输出地址
      'htmlDest': path.join(DEST_BASE_PATH, setting.dest.htmlPath),
      // css 输出地址
      'cssDest': path.join(DEST_BASE_PATH, setting.dest.cssPath),
      // images 输出地址
      'imagesDest': path.join(DEST_BASE_PATH, setting.dest.imagesPath),
      // assets 输出地址
      'revDest': path.join(DEST_BASE_PATH, setting.dest.revPath),
      // tpl 输出地址
      'tplDest': path.join(DEST_BASE_PATH, setting.dest.tplPath),
      // webpackconfig 中的 alias
      'jquery': path.join('./src/js/lib/jquery/jquery-1.11.1.js'),
      'babel-polyfill': path.join('./src/js/lib/babel-polyfill/babel-polyfill.js')
      // + yyl make
      // - yyl make
    },
    // + configCommit
    commit: {
      type: 'gitlab-ci',
      // 上线配置
      revAddr: `http://web.yystatic.com${setting.dest.basePath}/${setting.dest.revPath}/rev-manifest.json`,
      hostname: '//web.yystatic.com',
      staticHost: '//web.yystatic.com',
      mainHost: '//www.yy.com/web'
    }
    // - configCommit
  }
  if (env.mode !== 'master') {
    config.proxy.homePage = `http:/webtest.yy.com/${PROJECT_NAME}/`
    config.commit.revAddr = `http://webtest.yystatic.com${setting.dest.basePath}/${setting.dest.revPath}/rev-manifest.json`
    config.commit.hostname = '//webtest.yystatic.com'
    config.commit.staticHost = '//webtest.yystatic.com'
    config.commit.mainHost = '//webtest.yy.com'
  }
  return config
}

module.exports = makeConfig
