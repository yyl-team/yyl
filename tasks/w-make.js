'use strict';
var
  util = require('./w-util.js'),
  wServer = require('./w-server.js'),
  path = require('path'),
  fs = require('fs');


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
      'block title {{name}}',
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
          r = r.replace(new RegExp('\\{\\{' + key + '\\}\\}', 'g'), op[key] || '');
        }
      }
      return r;
    }
  };

var
  wMake = {
    init: function(name, op) {
      new util.Promise(function(next) {
        util.msg.info('build server config start');
        wServer.buildConfig(op.name, op, function(err, config) { // 创建 server 端 config
          if (err) {
            return util.msg.error('build server config error:', err);
          }

          util.msg.success('build server config done');
          util.printIt.init(config);
          next(config);
        });
      }).then(function(config, next) {
        var
          srcRoot = config.alias.srcRoot,
          widgetPath = '',
          type = '';

        console.log(name);


        if (/^p-/.test(name)) { // 页面级 组件
          widgetPath = util.joinFormat(srcRoot, 'components/page');
          type = 'page';
        } else if (/^[wr]-/.test(name)) { // 模块级 组件
          widgetPath = util.joinFormat(srcRoot, 'components/widget');
          type = 'widget';
        } else { // 不执行
          util.msg.warn('yyl make fail');
          util.msg.warn(name, 'is not a widget(w-xx|r-xx) or page(p-) components');
          return;
        }

        if (!fs.existsSync(widgetPath)) {
          widgetPath = util.joinFormat(srcRoot, 'components');
        }

        widgetPath = util.joinFormat(widgetPath, name);
        util.mkdirSync(widgetPath);

        next(widgetPath, type, srcRoot, config);
      }).then(function(widgetPath, type, srcRoot, config, next) { // scss 
        var scssPath = util.joinFormat(widgetPath, name + '.scss');
        var iTmpl;
        // scss 部分
        if (fs.existsSync(scssPath)) {
          util.msg.warn(util.printIt(scssPath), 'is exists', 'make it fail');
        } else {
          if (type == 'page') {
            iTmpl = TEMPLATE.SCSS.PAGE;
          } else if (type == 'widget') {
            iTmpl = TEMPLATE.SCSS.WIDGET;
          } else {
            iTmpl = TEMPLATE.SCSS.DEFAULT;
          }

          fs.writeFileSync(scssPath, fn.render(iTmpl, { 'name': name }));
          util.msg.create(util.printIt(scssPath));
        }

        next(widgetPath, type, srcRoot, config);
      }).then(function(widgetPath, type, srcRoot, config, next) { // jade
        var jadePath;
        if (config.workflow == 'gulp-requirejs') {
          jadePath = util.joinFormat(widgetPath, name + '.pug');
        } else {
          jadePath = util.joinFormat(widgetPath, name + '.jade');
        }
        var iTmpl;

        // jade 部分
        if (fs.existsSync(jadePath)) {
          util.msg.warn(util.printIt(jadePath), 'is exists', 'make it fail');
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
          util.msg.create(util.printIt(jadePath));
        }

        next(widgetPath, type, srcRoot, config);
      }).then(function(widgetPath, type, srcRoot, config, next) { // js
        var jsPath = util.joinFormat(widgetPath, name + '.js');
        var iTmpl;
        // js 部分
        if (fs.existsSync(jsPath)) {
          util.msg.warn(util.printIt(jsPath), 'is exists', 'make it fail');
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
          util.msg.create(util.printIt(jsPath));
        }

        next(widgetPath, type, srcRoot, config);
      }).then(function(widgetPath, type, srcRoot, config) { // alias
        var configPath, configCnts;

        // alias 部分
        if (config.workflow == 'gulp-requirejs') {
          configPath = util.joinFormat(srcRoot, 'js/rConfig/rConfig.js');
        } else if (/^(gulp-rollup|webpack-vue|webpack-vue2)$/.test(config.workflow)) {
          configPath = util.joinFormat( util.vars.PROJECT_PATH, 'config.js');
        }

        if (type == 'widget' && configPath && fs.existsSync(configPath)) {
          configCnts = fs.readFileSync(configPath).toString().split(/[\r\n]+/);
          // 查找标记位置
          var
            startIndex = -1,
            endIndex = -1,
            prefix = '';

          configCnts.forEach(function(str, i) {
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
            var
              moduleName = name.replace(/(^[rw])(-)(\w)(.*$)/, function(str, $1, $2, $3, $4) {
                return $1 + $3.toUpperCase() + $4;
              }),
              modulePath = util.joinFormat(path.relative(
                path.dirname(configPath),
                util.joinFormat(widgetPath, name)
              )),
              insertStr;

            switch (config.workflow) {
              case 'gulp-requirejs':
                break;

              default:
                modulePath += '.js';
                break;
            }

            insertStr = prefix + '\''+ moduleName +'\' : \''+ modulePath +'\',';

            // 查找是否已经添加过了
            var added = false;
            var isBeforeBracket = false; // 是否后面就跟着 花括号了
            var bracketReg = /^[\s\t]*\}[\s\t]*[,]?[\s\t]*$/;
            var commaReg = /,[\s\t]*$/;
            configCnts.slice(startIndex, endIndex).forEach(function(str) {
              if (str.replace(commaReg, '') == insertStr.replace(commaReg, '')) {
                added = true;
                return true;
              }
            });

            if (added) {
              return util.msg.warn(moduleName, 'was added to the config path before yyl make run');
            }

            configCnts.splice(startIndex + 1, 0, insertStr); // 插入
            endIndex += 1;
            if (~endIndex) { // 那就帮忙排个序吧
              isBeforeBracket = bracketReg.test(configCnts[endIndex + 1]);
              var sortArr = configCnts.slice(startIndex + 1, endIndex);
              sortArr.sort(function(a, b) {
                return b.localeCompare(a);
              });


              // 解决逗号问题
              if (isBeforeBracket) {
                if (!configCnts[startIndex - 1].match(commaReg)) {
                  configCnts[startIndex - 1] = configCnts[startIndex - 1] + ',';
                }
              }
              configCnts = configCnts.map(function(str, i) {
                var r;
                if (i >= startIndex + 1 && i < endIndex) {
                  r = sortArr[i - startIndex - 1];
                  if (isBeforeBracket) {
                    if ( i == endIndex - 1 ) { // 最后一个
                      r = r.replace(commaReg, '');
                    } else {
                      if (!r.match(commaReg)) {
                        r = r + ',';
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
                  configCnts[startIndex - 1] = configCnts[startIndex - 1] + ',';
                }
                configCnts[startIndex + 1] = configCnts[startIndex + 1].replace(commaReg, '');
              }
            }

            fs.writeFileSync(configPath, configCnts.join('\r\n'));
            util.msg.update(util.printIt(configPath));
            util.msg.update(insertStr.substr(prefix.length));
          } else {
            util.msg.warn('add alias fail,', 'config haven\'t the mark:');
            util.msg.warn(TEMPLATE.ALIAS.START);
            util.msg.warn('in config file:', util.printIt(configPath));
          }
        }
      }).start();
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
      var
        iArgv = util.makeArray(arguments),
        ctx = iArgv[0],
        op = util.envParse(iArgv.slice(1));

      if (!ctx) {
        wMake.help();
      } else {
        wMake.init(ctx, op);
      }
    }

  };

module.exports = wMake;
