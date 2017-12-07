'use strict';
var 
    util = require('./w-util.js'),
    wServer = require('./w-server.js'),
    fs = require('fs');


var TEMPLATE = {
    'JADE': {
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
            '\'use strict;\'',
            'require([], function() {',
            '});'
        ].join('\r\n'),
        'WIDGET': [
            '\'use strict;\'',
            'define([], function() {',
            '});'
        ].join('\r\n'),
        'DEFAULT': [
            '\'use strict;\''
        ].join('\r\n')
    }

};

var 
    fn = {
        render: function(tmpl, op){
            var r = tmpl;
            for(var key in op){
                if(op.hasOwnProperty(key)){
                    r = r.replace(new RegExp('\\{\\{' + key + '\\}\\}', 'g'), op[key] || '');
                }
            }
            return r;
        }
    };

var 
    wMake = {
        init: function(name, op){
            new util.Promise(function(next){

            util.msg.info('build server config start');
                wServer.buildConfig(op.name, op, function(err, config){ // 创建 server 端 config
                    if(err){
                        return util.msg.error('build server config error:', err);
                    }

                    util.msg.success('build server config done');
                    util.printIt.init(config);
                    next(config);

                });

            }).then(function(config){
                var 
                    srcRoot = config.alias.srcRoot,
                    widgetPath = '',
                    type = '';


                if(/^p\-/.test(name)){ // 页面级 组件
                    widgetPath = util.joinFormat(srcRoot, 'components/page');
                    type = 'page';

                } else if(/^[wr]\-/.test(name)){ // 模块级 组件
                    widgetPath = util.joinFormat(srcRoot, 'components/widget');
                    type = 'widget';

                } else { // 不执行
                    util.msg.warn('yyl make fail');
                    util.msg.warn(name + ' is not a widget(w-xx|r-xx) or page(p-) components');
                    return;
                }

                if(!fs.existsSync(widgetPath)){
                    widgetPath = util.joinFormat(srcRoot, 'components');
                }

                widgetPath = util.joinFormat(widgetPath, name);
                util.mkdirSync(widgetPath);

                var scssPath = util.joinFormat(widgetPath, name + '.scss');
                var jsPath = util.joinFormat(widgetPath, name + '.js');
                var jadePath = util.joinFormat(widgetPath, name + '.jade');
                var iTmpl;

                // scss 部分
                if(fs.existsSync(scssPath)){
                    util.msg.warn(util.printIt(scssPath), 'is exists', 'make it fail');
                } else {
                    if(type == 'page'){
                        iTmpl = TEMPLATE.JS.PAGE;
                    } else if(type == 'widget'){
                        iTmpl = TEMPLATE.JS.WIDGET;
                    } else {
                        iTmpl = TEMPLATE.JS.DEFAULT;
                    }

                    fs.writeFileSync(scssPath, fn.render(iTmpl, { 'name': name }));
                    util.msg.create(util.printIt(scssPath));
                }

                // js 部分
                if(fs.existsSync(jsPath)){
                    util.msg.warn(util.printIt(jsPath), 'is exists', 'make it fail');

                } else {
                    if(config.workflow == 'gulp-requirejs'){
                        if(type == 'page'){
                            iTmpl = TEMPLATE.JS.PAGE;
                        } else if(type == 'widget'){
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

                // jade 部分
                if(fs.existsSync(jadePath)){
                    util.msg.warn(util.printIt(jadePath), 'is exists', 'make it fail');

                } else {
                    iTmpl = TEMPLATE.JADE.DEFAULT;
                    fs.writeFileSync(jadePath, fn.render(iTmpl, {
                        'name': name
                    }));
                    util.msg.create(util.printIt(jadePath));
                }

                // alias部分
                if(config.workflow == 'gulp-requirejs'){
                    var rConfigPath = util.joinFormat(srcRoot, 'js/rConfig/rConfig.js');
                    var rConfigCnts;
                    if(fs.existsSync(rConfigPath)){
                        rConfigCnts = fs.readFileSync(rConfigPath).toString().split(/[\r\n]+/);
                        console.log(rConfigCnts);
                    }
                    // TODO 修改 rConfig

                } else if(/^(gulp\-rollup|webpack\-vue|webpack\-vue2)$/.test(config.workflow)){
                    // TODO 修改 config 中alias

                }
            }).start();



            

        },
        run: function(){
            var 
                iArgv = util.makeArray(arguments),
                ctx = iArgv[0],
                op = util.envParse(iArgv.slice(1));

            wMake.init(ctx, op);
        }

    };

module.exports = wMake;
