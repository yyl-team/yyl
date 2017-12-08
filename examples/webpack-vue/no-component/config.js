'use strict';
var 
    //+ yyl init 自动 匹配内容
    commonPath = /*+commonPath*/'../commons/mobile'/*-commonPath*/,
    projectName = /*+name*/'workflow_demo'/*-name*/,
    version = /*+version*/'1.0.0'/*-version*/,
    //- yyl init 自动 匹配内容
    path = require('path'),
    setting = {
        localserver: { // 本地服务器配置
            root: path.join(__dirname, './dist'), // 服务器输出地址
            port: 5000 // 服务器 port
        },
        dest: {
            basePath: '/website_static/mobileYY/test',
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
                'http://www.yy.com/': 'http://127.0.0.1:5000/',
                'http://wap.yy.com/': 'http://127.0.0.1:5000/'
            }
        },
        /**
         * 触发提交 svn 前中间件函数
         * @param {String}   sub    命令行 --sub 变量
         * @param {Function} next() 下一步
         */
        onBeforeCommit: function(sub, next){
            next();
        },

        /**
         * 初始化 config 时 对config的二次操作
         * @param {object}   config          服务器初始化完成的 config 对象
         * @param {object}   env             命令行接收到的 参数
         * @param {function} next(newconfig) 返回给服务器继续处理用的 next 函数
         * @param {object}   newconfig       处理后的 config
         */
        onInitConfig: function(config, env, next){
            next(config);
        }

    };

var
    config = {
        workflow: 'webpack-vue',
        name: projectName,
        version: version,
        dest: setting.dest,
        proxy: setting.proxy,

        onInitConfig: setting.onInitConfig,
        onBeforeCommit: setting.onBeforeCommit,

        // 需要构建工具额外安装的 npm 组件放这里 如 axios
        plugins: [],
        // +此部分 yyl server 端config 会进行替换
        localserver: setting.localserver,
        alias: { // yyl server 路径替换地方

            // svn dev 分支地址
            dev: path.join('../../../svn.yy.com/yy-music/web/publish/src/3g/mobile-website-static/trunk/mobileYY/test'),

            // svn trunk 分支地址
            trunk: path.join('../../../svn.yy.com/yy-music/web/publish/src/3g/mobile-website-static/branches/release/mobileYY/test'),


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
            revDest: path.join(setting.localserver.root, setting.dest.basePath, setting.dest.revPath)
            // + yyl make
            // - yyl make
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
            hostname: 'http://s1.yy.com/',
            git: {
                update: []
            },
            svn: {
                dev: {
                    update: [
                        '{$dev}/assets',
                        '{$dev}/mobileYY/test',
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
