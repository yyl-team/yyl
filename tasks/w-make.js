'use strict';
const path = require('path');
const fs = require('fs');

const util = require('./w-util.js');
const wServer = require('./w-server.js');
const log = require('./w-log.js');


var TEMPLATE = {
  'JADE': {
    'LAYOUT': [
      'doctype html',
      'html',
      '    head',
      '        meta(charset="utf-8")',
      '        meta(http-equiv="X-UA-Compatible", content="IE=edge,chrome=1")',
      '        meta(name="renderer", content="webkit")',
      '        title',
      '            block title',
      '',
      '        block head',
      '    body',
      '        block body',
      '',
      '        block script'
    ].join('\r\n'),
    'PAGE': [
      'extends ../w-layout/w-layout',
      'block title',
      '    | {{name}}',
      '',
      'block head',
      '    link(rel="stylesheet", href="./{{name}}.scss", type="text/css")',
      '',
      'block body',
      '',
      'append script',
      '    script(src="./{{name}}.js")'
    ].join('\r\n'),
    'WIDGET': [
      'mixin {{name}}'
    ].join('\r\n'),
    'DEFAULT': ''
  },
  'SCSS': {
    'PAGE': [
      '@charset "utf-8";'
    ].join('\r\n'),
    'WIDGET': [
      '@charset "utf-8";',
      'mixin {{name}}($path){',
      '}'
    ].join('\r\n'),
    'DEFAULT': [
      '@charset "utf-8";'
    ].join('\r\n')
  },
  'JS': {
    'PAGE': [
      '\'use strict\';',
      'require([], function() {',
      '});'
    ].join('\r\n'),
    'WIDGET': [
      '\'use strict\';',
      'define([], function() {',
      '});'
    ].join('\r\n'),
    'DEFAULT': [
      '\'use strict\';'
    ].join('\r\n')
  },
  'ALIAS': {
    'START': '// + yyl make',
    'END': '// - yyl make',
    'START_REG': /^([\s\t]*)\/\/\s*\+\s*yyl make\s*/,
    'END_REG'  : /^([\s\t]*)\/\/\s*-\s*yyl make\s*/
  }

};

var
  fn = {
    render: function(tmpl, op) {
      var r = tmpl;
      for (var key in op) {
        if (op.hasOwnProperty(key)) {
          r = r.replace(new RegExp(`\\{\\{${  key  }\\}\\}`, 'g'), op[key] || '');
        }
      }
      return r;
    }
  };

var
  wMake = {
    init: function(name, op) {
      const runner = (done) => {
        new util.Promise(((next) => {
          log('start', 'make');
          log('msg', 'info', 'build server config start');
          wServer.buildConfig(op.name, op).then((config) => {
            log('msg', 'success', 'build server config finished');
            next(config);
          }).catch((err) => {
            log('msg', 'error', ['build server config fail', err]);
            log('finish');
            throw new Error(err);
          });
        })).then((config, next) => {
          var srcRoot = config.alias.srcRoot;
          var widgetPath = '';
          var type = '';

          console.log(name);


          if (/^p-/.test(name)) { // 页面级 组件
            widgetPath = util.joinFormat(srcRoot, 'components/page');
            type = 'page';
          } else if (/^[wr]-/.test(name)) { // 模块级 组件
            widgetPath = util.joinFormat(srcRoot, 'components/widget');
            type = 'widget';
          } else { // 不执行
            log('msg', 'warn', 'yyl make fail');
            log('msg', 'warn', `${name} is not a widget(w-xx|r-xx) or page(p-) components`);
            return done(null);
          }

          if (!fs.existsSync(widgetPath)) {
            widgetPath = util.joinFormat(srcRoot, 'components');
          }

          widgetPath = util.joinFormat(widgetPath, name);
          util.mkdirSync(widgetPath);

          next(widgetPath, type, srcRoot, config);
        }).then((widgetPath, type, srcRoot, config, next) => { // scss
          var scssPath = util.joinFormat(widgetPath, `${name  }.scss`);
          var iTmpl;
          // scss 部分
          if (fs.existsSync(scssPath)) {
            log('msg', 'warn', `scss file exists, make fail: ${scssPath}`);
          } else {
            if (type == 'page') {
              iTmpl = TEMPLATE.SCSS.PAGE;
            } else if (type == 'widget') {
              iTmpl = TEMPLATE.SCSS.WIDGET;
            } else {
              iTmpl = TEMPLATE.SCSS.DEFAULT;
            }

            fs.writeFileSync(scssPath, fn.render(iTmpl, { 'name': name }));
            log('msg', 'create', scssPath);
          }

          next(widgetPath, type, srcRoot, config);
        }).then((widgetPath, type, srcRoot, config, next) => { // jade
          var jadePath;
          if (config.workflow == 'gulp-requirejs') {
            jadePath = util.joinFormat(widgetPath, `${name  }.pug`);
          } else {
            jadePath = util.joinFormat(widgetPath, `${name  }.jade`);
          }
          var iTmpl;

          // jade 部分
          if (fs.existsSync(jadePath)) {
            log('msg', 'warn', `jade file is exists, make fail: ${jadePath}`);
          } else {
            if (type == 'page') {
              iTmpl = TEMPLATE.JADE.PAGE;
            } else if (name == 'w-layout') {
              iTmpl = TEMPLATE.JADE.LAYOUT;
            } else if (type == 'widget') {
              iTmpl = TEMPLATE.JADE.WIDGET;
            } else {
              iTmpl = TEMPLATE.JADE.DEFAULT;
            }

            fs.writeFileSync(jadePath, fn.render(iTmpl, {
              'name': name
            }));
            log('msg', 'create', jadePath);
          }

          next(widgetPath, type, srcRoot, config);
        }).then((widgetPath, type, srcRoot, config, next) => { // js
          var jsPath = util.joinFormat(widgetPath, `${name  }.js`);
          var iTmpl;
          // js 部分
          if (fs.existsSync(jsPath)) {
            log('msg', 'warn', `js file is exist, make fail: ${jsPath}`);
          } else {
            if (config.workflow == 'gulp-requirejs') {
              if (type == 'page') {
                iTmpl = TEMPLATE.JS.PAGE;
              } else if (type == 'widget') {
                iTmpl = TEMPLATE.JS.WIDGET;
              } else {
                iTmpl = TEMPLATE.JS.DEFAULT;
              }
            } else {
              iTmpl = TEMPLATE.JS.DEFAULT;
            }

            fs.writeFileSync(jsPath, fn.render(iTmpl, {
              'name': name
            }));
            log('msg', 'create', jsPath);
          }

          next(widgetPath, type, srcRoot, config);
        }).then((widgetPath, type, srcRoot, config) => { // alias
          var configPath;
          var configCnts;

          // alias 部分
          if (config.workflow == 'gulp-requirejs') {
            configPath = util.joinFormat(srcRoot, 'js/rConfig/rConfig.js');
          } else if (/^(gulp-rollup|webpack-vue|webpack-vue2)$/.test(config.workflow)) {
            configPath = util.joinFormat( util.vars.PROJECT_PATH, 'config.js');
          }

          if (type == 'widget' && configPath && fs.existsSync(configPath)) {
            configCnts = fs.readFileSync(configPath).toString().split(/[\r\n]+/);
            // 查找标记位置
            var startIndex = -1;
            var endIndex = -1;
            var prefix = '';

            configCnts.forEach((str, i) => {
              if (!str) {
                return;
              }

              if (str.match(TEMPLATE.ALIAS.START_REG)) { // 开始 标记
                startIndex = i;
              } else if (str.match(TEMPLATE.ALIAS.END_REG)) { // 结束 标记
                endIndex = i;
              }
            });
            if (~startIndex) { // 插入模块
              prefix = configCnts[startIndex].replace(TEMPLATE.ALIAS.START_REG, '$1');
              var moduleName = name.replace(/(^[rw])(-)(\w)(.*$)/, (str, $1, $2, $3, $4) => {
                return $1 + $3.toUpperCase() + $4;
              });
              var modulePath = util.joinFormat(path.relative(
                path.dirname(configPath),
                util.joinFormat(widgetPath, name)
              ));
              var insertStr;

              switch (config.workflow) {
                case 'gulp-requirejs':
                  break;

                default:
                  modulePath += '.js';
                  break;
              }

              insertStr = `${prefix}'${moduleName}' : '${modulePath}',`;

              // 查找是否已经添加过了
              var added = false;
              var isBeforeBracket = false; // 是否后面就跟着 花括号了
              var bracketReg = /^[\s\t]*\}[\s\t]*[,]?[\s\t]*$/;
              var commaReg = /,[\s\t]*$/;
              configCnts.slice(startIndex, endIndex).forEach((str) => {
                if (str.replace(commaReg, '') == insertStr.replace(commaReg, '')) {
                  added = true;
                  return true;
                }
              });

              if (added) {
                log('msg', 'warn', `${moduleName} was added to the config path before yyl make run`);
                log('finish');
                return done();
              }

              configCnts.splice(startIndex + 1, 0, insertStr); // 插入
              endIndex += 1;
              if (~endIndex) { // 那就帮忙排个序吧
                isBeforeBracket = bracketReg.test(configCnts[endIndex + 1]);
                var sortArr = configCnts.slice(startIndex + 1, endIndex);
                sortArr.sort((a, b) => {
                  return b.localeCompare(a);
                });


                // 解决逗号问题
                if (isBeforeBracket) {
                  if (!configCnts[startIndex - 1].match(commaReg)) {
                    configCnts[startIndex - 1] = `${configCnts[startIndex - 1]  },`;
                  }
                }
                configCnts = configCnts.map((str, i) => {
                  var r;
                  if (i >= startIndex + 1 && i < endIndex) {
                    r = sortArr[i - startIndex - 1];
                    if (isBeforeBracket) {
                      if ( i == endIndex - 1 ) { // 最后一个
                        r = r.replace(commaReg, '');
                      } else {
                        if (!r.match(commaReg)) {
                          r = `${r  },`;
                        }
                      }
                    }
                  } else {
                    r = str;
                  }
                  return r;
                });
              } else {
                // 解决逗号问题
                isBeforeBracket = bracketReg.test(configCnts[startIndex + 2]);
                if (isBeforeBracket) {
                  if (!configCnts[startIndex - 1].match(commaReg)) {
                    configCnts[startIndex - 1] = `${configCnts[startIndex - 1]  },`;
                  }
                  configCnts[startIndex + 1] = configCnts[startIndex + 1].replace(commaReg, '');
                }
              }

              fs.writeFileSync(configPath, configCnts.join('\r\n'));
              log('msg', 'update', configPath);
              log('msg', 'update', insertStr.substr(prefix.length));
              log('finish');
              done();
            } else {
              log('msg', 'warn', 'add alias fail,', 'config haven\'t the mark:');
              log('msg', 'warn', TEMPLATE.ALIAS.START);
              log('msg', 'warn', `in config file: ${configPath}`);
              log('finish');
              done();
            }
          }
        }).start();
      };

      return new Promise((next) => {
        runner(next);
      });
    },
    help: function() {
      util.help({
        usage: 'yyl make',
        options: {
          'command': 'w-xx, r-xx wigets or p-xx pages component'
        }
      });
    },
    run: function() {
      var iArgv = util.makeArray(arguments);
      var ctx = iArgv[0];
      var op = util.envParse(iArgv.slice(1));

      if (!ctx) {
        return wMake.help();
      } else {
        return wMake.init(ctx, op);
      }
    }

  };

module.exports = wMake;
