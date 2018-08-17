/* elint indent: [ "warn", 2 , {"SwitchCase": 1}]*/
const config = {};

// + setting
const PROJECT_NAME = __data('name');
const setting = {
  localserver: { // 本地服务器配置
    root: './dist', // 服务器输出地址
    port: 5000 // 服务器 port
  },
  dest: {
    basePath: `/website_static/${PROJECT_NAME}`,
    jsPath: 'js',
    jslibPath: 'js/lib',
    cssPath: 'css',
    htmlPath: 'html',
    imagesPath: 'images',
    revPath: 'assets',
    tplPath: 'tpl'
  },
  // 代理服务器
  proxy: {
    port: 8887,
    localRemote: {
      'http://www.yy.com/': 'http://127.0.0.1:5000/',
      'http://wap.yy.com/': 'http://127.0.0.1:5000/'
    },
    ignores: []
  }
};
// - setting

Object.assign(config.localserver, setting.localserver);

// + commit
const SVN_ROOT_PATH = '../../../svn.yy.com';
Object.assign(config.alias, {
  dev: `${SVN_ROOT_PATH}/yy-music/web/publish/src/3g/mobile-website-static/trunk/${PROJECT_NAME}`,
  trunk: `${SVN_ROOT_PATH}/yy-music/web/publish/src/3g/mobile-website-static/branches/release/${PROJECT_NAME}`
});
Object.assign(config.commit, {
  // 上线配置
  revAddr: `http://s1.yy.com/website_static/${PROJECT_NAME}/assets/rev-manifest.json`,
  hostname: 'http://s1.yy.com',
  git: {
    update: []
  },
  svn: {
    dev: {
      update: [
        '{$dev}',
        '{$dev}/../assets'
      ],
      copy: {
        '{$root}/js': ['{$dev}/js'],
        '{$root}/css': ['{$dev}/css'],
        '{$root}/html': ['{$dev}/html'],
        '{$root}/images': ['{$dev}/images'],
        '{$root}/assets': ['{$dev}/assets']
      },
      commit: [
        '{$dev}/js',
        '{$dev}/css',
        '{$dev}/html',
        '{$dev}/images',
        '{$dev}/assets',
        '{$dev}/../assets'
      ]
    },
    trunk: {
      update: [
        '{$trunk}',
        '{$trunk}/../assets'
      ],
      copy: {
        '{$root}/js': ['{$trunk}/js'],
        '{$root}/css': ['{$trunk}/css'],
        '{$root}/html': ['{$trunk}/html'],
        '{$root}/images': ['{$trunk}/images'],
        '{$root}/assets': ['{$trunk}/assets']
      },
      commit: [
        '{$trunk}/js',
        '{$trunk}/css',
        '{$trunk}/html',
        '{$trunk}/images',
        '{$trunk}/assets',
        '{$trunk}/../assets'
      ]
    }
  }
});
// - commit

module.exports = config;

