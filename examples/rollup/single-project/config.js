'use strict';
var 
    //+ yyl init 自动 匹配内容
    commonPath = /*+commonPath*/'../commons/pc'/*-commonPath*/,
    projectName = /*+name*/'workflow_demo'/*-name*/,
    version = /*+version*/'1.0.0'/*-version*/,
    //- yyl init 自动 匹配内容

    path = require('path'),
    setting = {
        localserver: { // 本地服务器配置
            root: './dist', // 服务器输出地址
            port: 5000 // 服务器 port
        },
        dest: {
            basePath: '/pc',
            jsPath: 'js',
            jslibPath: 'js/lib',
            cssPath: 'css',
            htmlPath: 'html',
            imagesPath: 'images',
            revPath: 'assets'
        },
        // 代理服务器
        proxy: {
            port: 8887,
            localRemote: {
                //'http://www.yy.com/': './dist/',
                'http://www.yy.com/': 'http://127.0.0.1:5000/'
            }
        },
        // 提交之前回调函数
        beforeCommit: function(){}

    };

var
    config = {
        workflow: 'rollup',
        name: projectName,
        version: version,
        dest: setting.dest,
        proxy: setting.proxy,
        // +此部分 yyl server 端config 会进行替换
        localserver: setting.localserver,
        resource: { // 自定义项目中其他需打包的文件夹
            /*
            'src/swf': path.join(setting.localserver.root, setting.dest.basePath, 'swf'),
            'src/font': path.join(setting.localserver.root, setting.dest.basePath, 'font')
             */
        },
        alias: { // yyl server 路径替换地方
            // svn dev 分支地址
            dev: path.join('../../../svn.yy.com/yy-music/web-dragon/star-fans/yyweb/branches/develop'),

            // svn trunk 分支地址
            trunk: path.join('../../../svn.yy.com/yy-music/web-dragon/star-fans/yyweb/trunk'),


            // 公用组件地址
            commons: commonPath,

            // 公用 components 目录
            globalcomponents: path.join(commonPath, 'components'),
            globallib: path.join(commonPath, 'lib'),


            // 输出目录中 到 html, js, css, image 层 的路径
            root: path.join(setting.localserver.root, setting.dest.basePath),

            // rev 输出内容的相对地址
            revRoot: path.join(setting.localserver.root, setting.dest.basePath),

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
            revDest: path.join(setting.localserver.root, setting.dest.basePath, setting.dest.revPath),

            // 公用 alias
            rDemo: path.join('./src/components/r-demo/r-demo.js')
        },
        // -此部分 yyl server 端config 会进行替换

        // + 此部分 不要用相对路径
        // = 用 {$变量名} 方式代替, 没有合适变量可以自行添加到 alias 上
        concat: {
            // '{$srcRoot}/js/vendors.js': [
            //     '{$srcRoot}/js/lib/jquery/jquery-1.11.3.min.js'
            // ],
            // '{$jsDest}/vendors.js': [
            //     '{$srcRoot}/js/lib/jquery/jquery-1.11.3.min.js'
            // ]
        },

        commit: {
             // 上线配置
            revAddr: 'http://yyweb.yystatic.com/pc/assets/rev-manifest.json',
            hostname: 'http://yyweb.yystatic.com/',
            git: {
                update: []
            },
            svn: {
                dev: {
                    update: [
                        '{$dev}'
                    ],
                    copy: {
                        '{$root}/js': [
                            '{$dev}/static/resource/pc/js',
                            '{$dev}/yyweb-web/src/main/webapp/static/pc/js'
                        ],
                        '{$root}/css': [
                            '{$dev}/static/resource/pc/css',
                            '{$dev}/yyweb-web/src/main/webapp/static/pc/css'
                        ],
                        '{$root}/html': [
                            '{$dev}/static/resource/pc/html',
                            '{$dev}/yyweb-web/src/main/webapp/static/pc/html'
                        ],
                        '{$root}/images': [
                            '{$dev}/static/resource/pc/images',
                            '{$dev}/yyweb-web/src/main/webapp/static/pc/images'
                        ],
                        '{$root}/assets': [
                            '{$dev}/static/resource/pc/assets',
                            '{$dev}/yyweb-web/src/main/webapp/static/pc/assets'
                        ]
                    },
                    commit: [
                        '{$dev}/static/resource/pc/js',
                        '{$dev}/yyweb-web/src/main/webapp/static/pc/js',
                        '{$dev}/static/resource/pc/css',
                        '{$dev}/yyweb-web/src/main/webapp/static/pc/css',
                        '{$dev}/static/resource/pc/html',
                        '{$dev}/yyweb-web/src/main/webapp/static/pc/html',
                        '{$dev}/static/resource/pc/images',
                        '{$dev}/yyweb-web/src/main/webapp/static/pc/images',
                        '{$dev}/static/resource/pc/assets',
                        '{$dev}/yyweb-web/src/main/webapp/static/pc/assets'
                    ]

                },
                trunk: {
                    update: [
                        '{$trunk}'
                    ],
                    copy: {
                        '{$root}/js': [
                            '{$trunk}/static/resource/pc/js',
                            '{$trunk}/yyweb-web/src/main/webapp/static/pc/js'
                        ],
                        '{$root}/css': [
                            '{$trunk}/static/resource/pc/css',
                            '{$trunk}/yyweb-web/src/main/webapp/static/pc/css'
                        ],
                        '{$root}/html': [
                            '{$trunk}/static/resource/pc/html',
                            '{$trunk}/yyweb-web/src/main/webapp/static/pc/html'
                        ],
                        '{$root}/images': [
                            '{$trunk}/static/resource/pc/images',
                            '{$trunk}/yyweb-web/src/main/webapp/static/pc/images'
                        ],
                        '{$root}/assets': [
                            '{$trunk}/static/resource/pc/assets',
                            '{$trunk}/yyweb-web/src/main/webapp/static/pc/assets'
                        ]
                    },
                    commit: [
                        '{$trunk}/static/resource/pc/js',
                        '{$trunk}/yyweb-web/src/main/webapp/static/pc/js',
                        '{$trunk}/static/resource/pc/css',
                        '{$trunk}/yyweb-web/src/main/webapp/static/pc/css',
                        '{$trunk}/static/resource/pc/html',
                        '{$trunk}/yyweb-web/src/main/webapp/static/pc/html',
                        '{$trunk}/static/resource/pc/images',
                        '{$trunk}/yyweb-web/src/main/webapp/static/pc/images',
                        '{$trunk}/static/resource/pc/assets',
                        '{$trunk}/yyweb-web/src/main/webapp/static/pc/assets'
                    ]
                }

            }
        }
        // - 此部分 不要用相对路径
    };

module.exports = config;
