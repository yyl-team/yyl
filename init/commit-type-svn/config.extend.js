/* elint indent: [ "warn", 2 , {"SwitchCase": 1}]*/
const config = {};

const PROJECT_NAME = __data('name');
const PLATFORM = __data('platform');

// + setting
const setting = {
  localserver: { // 本地服务器配置
    root: './dist', // 服务器输出地址
    port: 5000 // 服务器 port
  },
  dest: {
    basePath: `/website_static/${PROJECT_NAME}/${PLATFORM}`,
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
Object.assign(config, {
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
  }
});
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

