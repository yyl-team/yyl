'use strict';
var 
    //+ yyl init 自动 匹配内容
    commonPath = '../../../../../../code.yy.com/ent-FEteam/commons',
    projectName = 'single-project',
    //- yyl init 自动 匹配内容
    path = require('path'),
    setting01 = {
        localserver: { // 本地服务器配置
            root: './dist', // 服务器输出地址
            port: 5000 // 服务器 port
        },
        dest: {
            basePath: '/mobileYY/test',
            jsPath: 'js/proj01',
            jslibPath: 'js/proj01/lib',
            cssPath: 'css/proj01',
            htmlPath: 'html/proj01',
            imagesPath: 'images/proj01',
            revPath: 'assets/proj01',
        },
        // 提交之前回调函数
        beforeCommit: function(){}

    },
    setting02 = {
        localserver: { // 本地服务器配置
            root: './dist', // 服务器输出地址
            port: 5000 // 服务器 port
        },
        dest: {
            basePath: '/mobileYY/test',
            jsPath: 'js/proj02',
            jslibPath: 'js/proj02/lib',
            cssPath: 'css/proj02',
            htmlPath: 'html/proj02',
            imagesPath: 'images/proj02',
            revPath: 'assets/proj02',
        },
        // 提交之前回调函数
        beforeCommit: function(){}

    };

var
    config = {
        proj01: {
            workflow: 'gulp-requirejs',
            name: projectName,
            dest: setting01.dest,
            // +此部分 yyl server 端config 会进行替换
            localserver: setting01.localserver,
            alias: { // yyl server 路径替换地方
                // svn dev 分支地址
                dev: path.join('../../../../../../svn.yy.com/yy-music/web/publish/src/3g/mobile-website-static/trunk/mobileYY/test'),

                // svn trunk 分支地址
                trunk: path.join('../../../../../../svn.yy.com/yy-music/web/publish/src/3g/mobile-website-static/branches/release/mobileYY/test'),

                // 公用组件地址
                commons: commonPath,

                // 公用 components 目录
                globalcomponents: path.join(commonPath, 'pc/components'),
                globallib: path.join(commonPath, 'pc/lib'),


                // 输出目录中 到 html, js, css, image 层 的路径
                root: path.join(setting01.localserver.root, setting01.dest.basePath),

                // rev 输出内容的相对地址
                revRoot: path.join(setting01.localserver.root, setting01.dest.basePath),

                // dest 地址
                destRoot: setting01.localserver.root,

                // src 地址
                srcRoot: './src/proj01',
                
                // 项目根目录
                dirname: './',

                // js 输出地址
                jsDest: path.join(setting01.localserver.root, setting01.dest.basePath, setting01.dest.jsPath),
                // js lib 输出地址
                jslibDest: path.join(setting01.localserver.root, setting01.dest.basePath, setting01.dest.jslibPath),
                // html 输出地址
                htmlDest: path.join(setting01.localserver.root, setting01.dest.basePath, setting01.dest.htmlPath),
                // css 输出地址
                cssDest: path.join(setting01.localserver.root, setting01.dest.basePath, setting01.dest.cssPath),
                // images 输出地址
                imagesDest: path.join(setting01.localserver.root, setting01.dest.basePath, setting01.dest.imagesPath),
                // assets 输出地址
                revDest: path.join(setting01.localserver.root, setting01.dest.basePath, setting01.dest.revPath)
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
                revAddr: 'http://s1.yy.com/website_static/mobileYY/test/assets/rev-manifest.json',
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
                            '{$dev}/assets'
                        ]

                    },
                    trunk: {
                        update: [
                            '{$trunk}'
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
                            '{$trunk}/assets'
                        ]
                    }

                }
            }
            // - 此部分 不要用相对路径

        },
        proj02: {
            workflow: 'gulp-requirejs',
            name: projectName,
            dest: setting02.dest,
            // +此部分 yyl server 端config 会进行替换
            localserver: setting02.localserver,
            alias: { // yyl server 路径替换地方
                // svn dev 分支地址
                dev: path.join('../../../../../../svn.yy.com/yy-music/web/publish/src/3g/mobile-website-static/trunk/mobileYY/test'),

                // svn trunk 分支地址
                trunk: path.join('../../../../../../svn.yy.com/yy-music/web/publish/src/3g/mobile-website-static/branches/release/mobileYY/test'),

                // 公用组件地址
                commons: commonPath,

                // 公用 components 目录
                globalcomponents: path.join(commonPath, 'pc/components'),
                globallib: path.join(commonPath, 'pc/lib'),


                // 输出目录中 到 html, js, css, image 层 的路径
                root: path.join(setting02.localserver.root, setting02.dest.basePath),

                // rev 输出内容的相对地址
                revRoot: path.join(setting02.localserver.root, setting02.dest.basePath),

                // dest 地址
                destRoot: setting02.localserver.root,

                // src 地址
                srcRoot: './src/proj02',
                
                // 项目根目录
                dirname: './',

                // js 输出地址
                jsDest: path.join(setting02.localserver.root, setting02.dest.basePath, setting02.dest.jsPath),
                // js lib 输出地址
                jslibDest: path.join(setting02.localserver.root, setting02.dest.basePath, setting02.dest.jslibPath),
                // html 输出地址
                htmlDest: path.join(setting02.localserver.root, setting02.dest.basePath, setting02.dest.htmlPath),
                // css 输出地址
                cssDest: path.join(setting02.localserver.root, setting02.dest.basePath, setting02.dest.cssPath),
                // images 输出地址
                imagesDest: path.join(setting02.localserver.root, setting02.dest.basePath, setting02.dest.imagesPath),
                // assets 输出地址
                revDest: path.join(setting02.localserver.root, setting02.dest.basePath, setting02.dest.revPath)
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
                revAddr: 'http://s1.yy.com/website_static/mobileYY/test/assets/rev-manifest.json',
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
                            '{$dev}/assets'
                        ]

                    },
                    trunk: {
                        update: [
                            '{$trunk}'
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
                            '{$trunk}/assets'
                        ]
                    }

                }
            }
            // - 此部分 不要用相对路径

        }
        
    };

module.exports = config;
