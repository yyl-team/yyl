'use strict';
var 
    //+ yyl init 自动 匹配内容
    commonPath = /*+commonPath*/'../../../../../code.yy.com/ent-FEteam/commons'/*-commonPath*/,
    projectName = /*+name*/'name'/*-name*/,
    //- yyl init 自动 匹配内容
    
    path = require('path'),
    setting = {
        localserver: { // 本地服务器配置
            root: './dist', // 服务器输出地址
            port: 5000 // 服务器 port
        },
        dest: {
            basePath: '/path01/path02',
            jsPath: 'js/name01',
            jslibPath: 'js/name01/lib',
            cssPath: 'css/name01',
            htmlPath: 'html/name01',
            imagesPath: 'images/name01',
            revPath: 'assets/name01'
        },
        // 提交之前回调函数
        beforeCommit: function(){}

    };

var
    config = {
        workflow: 'gulp-requirejs',
        dest: setting.dest,
        // +此部分 yyl server 端config 会进行替换
        localserver: setting.localserver,
        alias: { // yyl server 路径替换地方
            // svn trunk 地址
            trunk: path.join('../../../svn.yy.com/yy-music/web/publish/src/3g/mobile-website-static/trunk'),
            // svn dev 地址
            dev: path.join('../../../svn.yy.com/yy-music/web/publish/src/3g/mobile-website-static/'),

            // 公用组件地址
            commons: commonPath,

            // 公用 components 目录
            globalcomponents: path.join(commonPath, 'pc/components'),
            globallib: path.join(commonPath, 'pc/lib'),


            // 输出目录中 到 html, js, css, image 层 的路径
            root: path.join(setting.localserver.root, setting.dest.basePath),

            // dest 地址
            destRoot: setting.localserver.root,

            // src 地址
            srcRoot: './src',
            
            // 项目根目录
            dirname: './',

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
