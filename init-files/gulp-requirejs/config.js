'use strict';
var 
    path = require('path'),
    setting = {
        localserver: { // 本地服务器配置
            root: './dist', // 服务器输出地址
            path: '/mobileYY/mobile_yy_rp', // 项目路径
            commons: '../../../../../code.yy.com/ent-FEteam/commons', // 公用目录

            revRoot: './dist', // rev-menifest 内容相对路径
            srcRoot: './src', // 开发代码 路径
            jsDest: 'js', // js 输出路径
            jslibDest: 'js/lib', // jslib 输出路径
            cssDest: 'css', // css 输出路径
            htmlDest: 'html', // html 输出路径
            imagesDest: 'images', // images 输出路径
            revDest: 'assets', // md5 映射表
            port: 5000 // 服务器 port
        },
        // 提交之前回调函数
        beforeCommit: function(){}

    };

var
    config = {
        workflow: 'gulp-requirejs',
        localserver: setting.localserver,

        // +此部分 yyl server 端config 会进行替换
        alias: { // yyl server 路径替换地方
            // svn trunk 地址
            trunk: path.join('../../../svn.yy.com/yy-music/web/publish/src/3g/mobile-website-static/trunk'),
            // svn dev 地址
            dev: path.join('../../../svn.yy.com/yy-music/web/publish/src/3g/mobile-website-static/'),

            // 公用组件地址
            commons: setting.localserver.commons,

            // 公用 components 目录
            globalcomponents: path.join(setting.localserver.commons, 'pc/components'),
            globallib: path.join(setting.localserver.commons, 'pc/lib'),


            // 输出目录中 到 html, js, css, image 层 的路径
            root: path.join(setting.localserver.root, setting.localserver.path),

            // src 地址
            srcRoot: setting.localserver.srcRoot,
            // dest 地址
            destRoot: setting.localserver.root,
            
            // 项目根目录
            dirname: './',

            // js 输出地址
            jsDest: path.join(setting.localserver.root, setting.localserver.path, setting.localserver.jsDest),
            // js lib 输出地址
            jslibDest: path.join(setting.localserver.root, setting.localserver.path, setting.localserver.jslibDest),
            // html 输出地址
            htmlDest: path.join(setting.localserver.root, setting.localserver.path, setting.localserver.htmlDest),
            // css 输出地址
            cssDest: path.join(setting.localserver.root, setting.localserver.path, setting.localserver.cssDest),
            // images 输出地址
            imagesDest: path.join(setting.localserver.root, setting.localserver.path, setting.localserver.imagesDest),

            // assets 输出地址
            revDest: path.join(setting.localserver.root, setting.localserver.path, setting.localserver.revDest),
            // rev-menifest 输出路径
            revPath: path.join(setting.localserver.root, setting.localserver.path, 'assets/rev-manifest.json')
        },
        // -此部分 yyl server 端config 会进行替换

        // + 此部分 不要用相对路径
        // = 用 {$变量名} 方式代替, 没有合适变量可以自行添加到 alias 上
        concat: {
            '{$srcRoot}/js/vendors.js': [
                '{$commons}/pc/lib/jQuery/jquery-1.11.1.min.js'
            ],
            '{$root}/js/vendors.js': [
                '{$commons}/pc/lib/jQuery/jquery-1.11.1.min.js'
            ]
        },

        commit: {
             // 上线配置
            revAddr: 'http://s1.yy.com/website_static/mobileYY/mobile_yy_rp/assets/rev-manifest.json',
            hostname: 'http://s1.yy.com/website_static/',
            git: {
                update: [
                    '{$commons}'
                ]
            },
            svn: {
                dev: {
                    update: [
                        '{$dev}'
                    ],
                    copy: {
                        '{$root}': [
                            '{$dev}'
                        ]
                    },
                    commit: [
                        '{$dev}/js',
                        '{$dev}/css',
                        '{$dev}/html',
                        '{$dev}/images',
                        '{$dev}/assets'
                    ]

                },
                trunk: {
                    update: [
                        '{$trunk}'
                    ],
                    copy: {
                        '{$root}': [
                            '{$trunk}'
                        ]
                    },
                    commit: [
                        '{$trunk}/js',
                        '{$trunk}/css',
                        '{$trunk}/html',
                        '{$trunk}/images',
                        '{$trunk}/assets'
                    ]
                }

            }
        }
        // - 此部分 不要用相对路径
    };

module.exports = config;
