'use strict'
var //+ yyl init 自动 匹配内容
  commonPath = '../commons',
  projectName = 'gulp-requirejs',
  version = '2.15.32',
  //- yyl init 自动 匹配内容

  path = require('path'),
  setting = {
    localserver: {
      // 本地服务器配置
      root: './dist', // 服务器输出地址
      port: 5000, // 服务器 port
    },
    dest: {
      basePath: '/pc',
      jsPath: 'js/test',
      jslibPath: 'js/lib/test',
      cssPath: 'css/test',
      htmlPath: 'html/test',
      imagesPath: 'images/test',
      fontPath: 'font/test',
      tplPath: 'tpl/test',
      revPath: 'assets/test',
    },
    // 代理服务器
    proxy: {
      port: 8887,
      localRemote: {
        //'http://www.yy.com/': './dist/',
        'http://www.yy.com/': 'http://127.0.0.1:5000/',
      },
    },
    /**
     * 触发提交 svn 前中间件函数
     * @param {String}   sub    命令行 --sub 变量
     * @param {Function} next() 下一步
     */
    onBeforeCommit: function (sub, next) {
      next()
    },

    /**
     * 初始化 config 时 对config的二次操作
     * @param {object}   config          服务器初始化完成的 config 对象
     * @param {object}   env             命令行接收到的 参数
     * @param {function} next(newconfig) 返回给服务器继续处理用的 next 函数
     * @param {object}   newconfig       处理后的 config
     */
    onInitConfig: function (config, env, next) {
      next(config)
    },
  }

var config = {
  workflow: 'gulp-requirejs',
  name: projectName,
  version: version,
  dest: setting.dest,
  proxy: setting.proxy,

  onInitConfig: setting.onInitConfig,
  onBeforeCommit: setting.onBeforeCommit,

  // +此部分 yyl server 端config 会进行替换
  localserver: setting.localserver,
  resource: {
    // 自定义项目中其他需打包的文件夹
    'src/font': path.join(
      setting.localserver.root,
      setting.dest.basePath,
      setting.dest.fontPath
    ),
  },
  alias: {
    // yyl server 路径替换地方
    // svn dev 分支地址
    dev: path.join('../__committest/workflow_demo/branches/develop'),

    // svn trunk 分支地址
    trunk: path.join('../__committest/workflow_demo/trunk'),
    // 公用组件地址
    commons: commonPath,

    // 公用 components 目录
    globalcomponents: path.join(commonPath, 'components'),
    globallib: path.join(commonPath, 'lib'),

    // 输出目录中 到 html, js, css, image 层 的路径
    root: path.join(setting.localserver.root, setting.dest.basePath),

    // rev 输出内容的相对地址
    revRoot: path.join(setting.localserver.root, setting.dest.basePath),

    // dest 地址
    destRoot: setting.localserver.root,

    // src 地址
    srcRoot: './src',

    // 项目根目录
    dirname: './',

    // js 输出地址
    jsDest: path.join(
      setting.localserver.root,
      setting.dest.basePath,
      setting.dest.jsPath
    ),
    // js lib 输出地址
    jslibDest: path.join(
      setting.localserver.root,
      setting.dest.basePath,
      setting.dest.jslibPath
    ),
    // html 输出地址
    htmlDest: path.join(
      setting.localserver.root,
      setting.dest.basePath,
      setting.dest.htmlPath
    ),
    // css 输出地址
    cssDest: path.join(
      setting.localserver.root,
      setting.dest.basePath,
      setting.dest.cssPath
    ),
    // images 输出地址
    imagesDest: path.join(
      setting.localserver.root,
      setting.dest.basePath,
      setting.dest.imagesPath
    ),
    // assets 输出地址
    revDest: path.join(
      setting.localserver.root,
      setting.dest.basePath,
      setting.dest.revPath
    ),
    tplDest: path.join(
      setting.localserver.root,
      setting.dest.basePath,
      setting.dest.tplPath
    ),
  },
  // -此部分 yyl server 端config 会进行替换

  // + 此部分 不要用相对路径
  // = 用 {$变量名} 方式代替, 没有合适变量可以自行添加到 alias 上
  concat: {
    '{$jsDest}/vendors.js': [
      '{$srcRoot}/js/lib/jQuery/jquery-1.11.1.js',
      '{$srcRoot}/js/lib/lazyload/jquery.lazyload.js',
    ],
    '{$cssDest}/color.css': ['{$srcRoot}/css/a.css', '{$srcRoot}/css/b.css'],
  },

  commit: {
    // 上线配置
    revAddr: 'http://yyweb.yystatic.com/pc/assets/rev-manifest.json',
    staticHost: 'http://yyweb.yystatic.com/',
    mainHost: 'http://www.yy.com',
    hostname: 'http://yyweb.yystatic.com/',
    git: {
      update: [],
    },
    svn: {
      dev: {
        update: [],
        copy: {
          '{$root}/js': ['{$dev}/pc/dist/js'],
          '{$root}/css': ['{$dev}/pc/dist/css'],
          '{$root}/html': ['{$dev}/pc/dist/html'],
          '{$root}/images': ['{$dev}/pc/dist/images'],
          '{$root}/assets': ['{$dev}/pc/dist/assets'],
        },
        commit: ['{$dev}/pc/dist'],
      },
      trunk: {
        update: [],
        copy: {
          '{$root}/js': ['{$trunk}/pc/js'],
          '{$root}/css': ['{$trunk}/pc/css'],
          '{$root}/html': ['{$trunk}/pc/html'],
          '{$root}/images': ['{$trunk}/pc/images'],
          '{$root}/assets': ['{$trunk}/pc/assets'],
        },
        commit: ['{$trunk}/pc'],
      },
    },
  },
  // - 此部分 不要用相对路径
}

module.exports = config
