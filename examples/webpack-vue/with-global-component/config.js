'use strict';
var 
    //+ yyl init 自动 匹配内容
    commonPath = /*+commonPath*/'../../../../public/global'/*-commonPath*/,
    projectName = /*+name*/'workflow_demo'/*-name*/,
    //- yyl init 自动 匹配内容
    path = require('path'),
    setting = {
        localserver: { // 本地服务器配置
            root: path.join(__dirname, './dist'), // 服务器输出地址
            port: 5000 // 服务器 port
        },
        dest: {
            basePath: '/project/'+ projectName +'/mobile',
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
        workflow: 'webpack-vue',
        name: projectName,
        dest: setting.dest,
        // +此部分 yyl server 端config 会进行替换
        localserver: setting.localserver,
        alias: { // yyl server 路径替换地方

            // svn dev 分支地址
            dev: path.join('./'),
            // svn commit 分支地址
            commit: path.join('../../commit/mobile'),
            // svn trunk 分支地址
            trunk: path.join('../../../trunk/mobile'),


            // 公用组件地址
            commons: commonPath,

            // 公用 components 目录
            globalcomponents: path.join(commonPath, '../plugin/mobile'),
            globallib: path.join(commonPath, 'lib'),


            // 输出目录中 到 html, js, css, image 层 的路径
            root: path.join(setting.localserver.root, setting.dest.basePath),

            // rev 输出内容的相对地址
            revRoot: path.join(setting.localserver.root, setting.dest.basePath),

            // dest 地址
            destRoot: setting.localserver.root,

            // src 地址
            srcRoot: path.join(__dirname, './src'),
            
            // 项目根目录
            dirname: __dirname,

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



            // webpackconfig 中的 alias
            flexlayout: path.join(path.join(commonPath, 'lib'), 'flexLayout/flexLayout-1.4.0.js'),
            util: path.join(path.join(commonPath, 'lib'), 'yymUtil/1.1.0/yymUtil.js'),

            debugtool: path.join(path.join(commonPath, '../plugin'), 'mobile/v-devtool/1.0.0/v-devtool.js'),
            debugtoolVuex: path.join(path.join(commonPath, '../plugin'), 'mobile/v-devtool/1.0.0/vuex.js')
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
            revAddr: 'http://web.yystatic.com/project/'+ projectName +'/mobile/assets/rev-manifest.json',
            hostname: 'http://web.yystatic.com/',
            git: {
                update: []
            },
            svn: {
                dev: {
                    update: [
                        '{$dev}'
                    ],
                    copy: {
                        '{$root}/js': ['{$dev}/dist/js'],
                        '{$root}/css': ['{$dev}/dist/css'],
                        '{$root}/html': ['{$dev}/dist/html'],
                        '{$root}/images': ['{$dev}/dist/images'],
                        '{$root}/assets': ['{$dev}/dist/assets'],
                        '{$srcRoot}': ['{$dev}/src']
                    },
                    commit: [
                        '{$dev}/dist/js',
                        '{$dev}/dist/css',
                        '{$dev}/dist/html',
                        '{$dev}/dist/images',
                        '{$dev}/dist/assets',
                        '{$dev}/src'
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
