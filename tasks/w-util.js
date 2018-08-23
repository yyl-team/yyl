/* no-const-assign: 0 */
'use strict';

const util = require('yyl-util');
const os = require('os');
const path = require('path');
const fs = require('fs');

const USERPROFILE = process.env[process.platform == 'win32'? 'USERPROFILE': 'HOME'];
const CWD = process.cwd();

const rUtil = util.extend(true, util, {
  vars: {
    // 本程序根目录
    BASE_PATH: path.join(__dirname, '..'),

    // init path
    INIT_PATH: path.join(__dirname, '../init'),

    IS_WINDOWS: process.platform == 'win32',

    // svn rev 文件保留多少个版本
    REV_KEEP_COUNT: 3,
    // 当前cmd 所在地址
    PROJECT_PATH: util.joinFormat(CWD),

    // 搜索用 common 目录路径匹配
    COMMIN_PATH_LIKE: 'public/global',
    // COMMIN_PATH_LIKE: 'common/pc',

    // 用户设置文件地址
    USER_CONFIG_FILE: util.joinFormat(CWD, 'config.js'),

    // 用户 package.json 地址
    USER_PKG_FILE: util.joinFormat(CWD, 'package.json'),

    // server 根目录
    SERVER_PATH: util.joinFormat(USERPROFILE, '.yyl'),

    // server 工作流目录
    SERVER_WORKFLOW_PATH: util.joinFormat(USERPROFILE, '.yyl/init-files'),
    // server lib 目录
    SERVER_LIB_PATH: util.joinFormat(USERPROFILE, '.yyl/lib'),

    // server 数据存放目录
    SERVER_DATA_PATH: util.joinFormat(USERPROFILE, '.yyl/data'),

    // server 存放 更新程序目录
    SERVER_UPDATE_PATH: util.joinFormat(USERPROFILE, '.yyl/update/yyl'),

    // server 存放 https 证书的目录
    SERVER_CERTS_PATH: util.joinFormat(USERPROFILE, '.yyl/certs'),

    // server 存放 项目 plugins 目录
    SERVER_NPM_PATH: util.joinFormat(USERPROFILE, '.yyl/npm'),

    // 本机 ip地址
    LOCAL_SERVER: (function() {
      var ipObj = os.networkInterfaces();
      var ipArr;
      for (var key in ipObj) {
        if (ipObj.hasOwnProperty(key)) {
          ipArr = ipObj[key];
          for (var fip, i = 0, len = ipArr.length; i < len; i++) {
            fip = ipArr[i];
            if (fip.family.toLowerCase() == 'ipv4' && !fip.internal) {
              return fip.address;
            }
          }
        }
      }
      return '127.0.0.1';
    })()
  },
  readJSON: function (path) {
    if (!fs.existsSync(path)) {
      throw new Error(`File not exists: ${path}`);
    }
    return JSON.parse(fs.readFileSync(path));
  },

  livereload: function() {
    var reloadPath = `http://${util.vars.LOCAL_SERVER}:35729/changed?files=1`;
    util.get(reloadPath);
  },


});

rUtil.msg.init({
  maxSize: 8,
  type: {
    rev: {name: 'rev', color: '#ffdd00'},
    concat: {name: 'Concat', color: 'cyan'},
    update: {name: 'Updated', color: 'cyan'},
    proxyTo: {name: 'Proxy =>', color: 'gray'},
    proxyBack: {name: 'Proxy <=', color: 'cyan'},
    supercall: {name: 'Supercal', color: 'magenta'},
    optimize: {name: 'Optimize', color: 'green'},
    cmd: {name: 'CMD', color: 'gray'}
  }
});

module.exports = rUtil;
