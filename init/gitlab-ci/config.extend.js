'use strict';
const config = {};

// + setting
const PROJECT_NAME = __data('name');
const setting = {
  localserver: { // 本地服务器配置
    root: './dist', // 服务器输出地址
    port: 5000 // 服务器 port
  },
  dest: {
    basePath: `/project/${PROJECT_NAME}/pc`,
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
      'http://www.yy.com/web/': 'http://127.0.0.1:5000/',
      'http://web.yy.com/': 'http://127.0.0.1:5000/'
    }
  }
};
// - setting

Object.assign(config.localserver, setting.localserver);

// + commit
Object.assign(config, {
  commit: {
    // 上线配置
    revAddr: `http://web.yystatic.com${setting.dest.basePath}/${setting.dest.revPath}/rev-manifest.json`,
    hostname: '//web.yystatic.com',
    staticHost: '//web.yystatic.com',
    mainHost: '//www.yy.com/web'
  }
});
// - commit

module.exports = config;
