'use strict';
var
    path = require('path'),
    setting = {
        localserver: { // 本地服务器配置
            root: './build', // 服务器输出地址
            port: 5000 // 服务器 port
        },
        dest: {
            basePath: '/pc',
            jsPath: 'js/tt',
            jslibPath: 'js/lib/tt',
            cssPath: 'css/tt',
            htmlPath: 'html/tt',
            imagesPath: 'images/tt',
            fontPath: 'font/tt',
            revPath: 'assets/tt'
        }
    };

var
    config = {
        resource: { // 自定义项目中其他需打包的文件夹
            'src/font': path.join(setting.localserver.root, setting.dest.basePath, setting.dest.fontPath)
        },
        alias: { // yyl server 路径替换地方
            // 输出目录中 到 html, js, css, image 层 的路径
            root: path.join(setting.localserver.root, setting.dest.basePath),

            // rev 输出内容的相对地址
            revRoot: path.join(setting.localserver.root, setting.dest.basePath),

            // dest 地址
            destRoot: setting.localserver.root,

            // js 输出地址
            jsDest: path.join(setting.localserver.root, setting.dest.basePath, setting.dest.jsPath),
            // js lib 输出地址
            jslibDest: path.join(setting.localserver.root, setting.dest.basePath, setting.dest.jslibPath),
            // html 输出地址
            htmlDest: path.join(setting.localserver.root, setting.dest.basePath, setting.dest.htmlPath),
            // css 输出地址
            cssDest: path.join(setting.localserver.root, setting.dest.basePath, setting.dest.cssPath),
            // images 输出地址
            imagesDest: path.join(setting.localserver.root, setting.dest.basePath, setting.dest.imagesPath),
            // assets 输出地址
            revDest: path.join(setting.localserver.root, setting.dest.basePath, setting.dest.revPath)
        }
        // -此部分 yyl server 端config 会进行替换
    };

module.exports = config;
