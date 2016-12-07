'use strict';
var 
    //+ yyl init 自动 匹配内容
    commonPath = '../../../public/global',
    projectName = 'single-project',
    //- yyl init 自动 匹配内容
    path = require('path'),
    setting = {
        localserver: { // 本地服务器配置
            root: './dist', // 服务器输出地址
            port: 5000 // 服务器 port
        },
        dest: {
            basePath: '/',
            jsPath: 'js',
            jslibPath: 'js/lib',
            cssPath: 'css',
            htmlPath: 'html',
            imagesPath: 'images',
            revPath: 'assets'
        },
        // 提交之前回调函数
        beforeCommit: function(){}

    };

var
    config = {
        workflow: 'browserify-babel',
        name: projectName,
        dest: setting.dest,
        // +此部分 yyl server 端config 会进行替换
        localserver: setting.localserver,
        alias: { // yyl server 路径替换地方

            // svn dev 分支地址
            dev: path.join('../../../../../svn.yy.com/yy-music/static/project/workflow_demo/branches/develop'),
            // svn commit 分支地址
            commit: path.join('../../../../../svn.yy.com/yy-music/static/project/workflow_demo/branches/commit'),
            // svn trunk 分支地址
            trunk: path.join('../../../../../svn.yy.com/yy-music/static/project/workflow_demo/trunk'),


            // 公用组件地址
            commons: commonPath,

            // 公用 components 目录
            globalcomponents: path.join(commonPath, '../plugin/pc'),
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
            revDest: path.join(setting.localserver.root, setting.dest.basePath, setting.dest.revPath)
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
    };

module.exports = config;
