'use strict';

const PROJECT_NAME = __data('name');
const PLATFORM = __data('platform');

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
      'http://web.yy.com/': 'http://127.0.0.1:5000/'
    },
    homePage: `http://www.yy.com/web/${PROJECT_NAME}/`
  }
};
setting.proxy.localRemote[`http://www.yy.com/web/${PROJECT_NAME}`] = `http://127.0.0.1:5000/project/${PROJECT_NAME}/${PLATFORM}/html`;
setting.proxy.localRemote['http://www.yy.com/api/mock'] = 'http://127.0.0.1:5000/api/mock';
// - setting

const config = {
  localServer: setting.localserver,
  dest: setting.dest,
  proxy: setting.proxy,
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
};

module.exports = config;

