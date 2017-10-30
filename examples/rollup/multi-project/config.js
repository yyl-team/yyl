'use strict';
var 
    //+ yyl init 自动 匹配内容
    commonPath = /*+commonPath*/'../commons/pc'/*-commonPath*/,
    projectName = /*+name*/'workflow_demo'/*-name*/,
    version = /*+version*/'1.0.0'/*-version*/,
    //- yyl init 自动 匹配内容
    path = require('path'),
    setting01 = {
        localserver: { // 本地服务器配置
            root: './dist', // 服务器输出地址
            port: 5000 // 服务器 port
        },
        dest: {
            basePath: '/pc',
            jsPath: 'js/proj01',
            jslibPath: 'js/proj01/lib',
            cssPath: 'css/proj01',
            htmlPath: 'html/proj01',
            imagesPath: 'images/proj01',
            revPath: 'assets/proj01',
        },
        // 代理服务器
        proxy: {
            port: 8887,
            localRemote: {
                //'http://www.yy.com/': './dist/',
                'http://www.yy.com/': 'http://127.0.0.1:5000/'
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

    },
    setting02 = {
        localserver: { // 本地服务器配置
            root: './dist', // 服务器输出地址
            port: 5000 // 服务器 port
        },
        dest: {
            basePath: '/pc',
            jsPath: 'js/proj02',
            jslibPath: 'js/proj02/lib',
            cssPath: 'css/proj02',
            htmlPath: 'html/proj02',
            imagesPath: 'images/proj02',
            revPath: 'assets/proj02',
        },
        // 代理服务器
        proxy: {
            port: 8887,
            localRemote: {
                'http://www.yy.com/': './dist/'
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
        proj01: {
            workflow: 'rollup',
            name: projectName,
            version: version,
            dest: setting01.dest,
            proxy: setting01.proxy,

            onInitConfig: setting01.onInitConfig,
            onBeforeCommit: setting01.onBeforeCommit,

            // +此部分 yyl server 端config 会进行替换
            localserver: setting01.localserver,
            resource: { // 自定义项目中其他需打包的文件夹
                /*
                'src/swf': path.join(setting01.localserver.root, setting01.dest.basePath, 'swf'),
                'src/font': path.join(setting01.localserver.root, setting01.dest.basePath, 'font')
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
                revDest: path.join(setting01.localserver.root, setting01.dest.basePath, setting01.dest.revPath),

                rDemo: path.join('src/proj01/components/r-demo/r-demo.js')
            },
            // -此部分 yyl server 端config 会进行替换

            // + 此部分 不要用相对路径
            // = 用 {$变量名} 方式代替, 没有合适变量可以自行添加到 alias 上
            concat: {
            },

            commit: {
                 // 上线配置
                revAddr: 'http://yyweb.yystatic.com/pc/assets/proj01/rev-manifest.json',
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
                            '{$root}/js/proj01': [
                                '{$dev}/static/resource/pc/js/proj01',
                                '{$dev}/yyweb-web/src/main/webapp/static/pc/js/proj01'
                            ],
                            '{$root}/css/proj01': [
                                '{$dev}/static/resource/pc/css/proj01',
                                '{$dev}/yyweb-web/src/main/webapp/static/pc/css/proj01'
                            ],
                            '{$root}/html/proj01': [
                                '{$dev}/static/resource/pc/html/proj01',
                                '{$dev}/yyweb-web/src/main/webapp/static/pc/html/proj01'

                            ],
                            '{$root}/images/proj01': [
                                '{$dev}/static/resource/pc/images/proj01',
                                '{$dev}/yyweb-web/src/main/webapp/static/pc/images/proj01'
                            ],
                            '{$root}/assets/proj01': [
                                '{$dev}/static/resource/pc/assets/proj01',
                                '{$dev}/yyweb-web/src/main/webapp/static/pc/assets/proj01'
                            ]
                        },
                        commit: [
                            '{$dev}/static/resource/pc/js/proj01',
                            '{$dev}/yyweb-web/src/main/webapp/static/pc/js/proj01',
                            '{$dev}/static/resource/pc/css/proj01',
                            '{$dev}/yyweb-web/src/main/webapp/static/pc/css/proj01',
                            '{$dev}/static/resource/pc/html/proj01',
                            '{$dev}/yyweb-web/src/main/webapp/static/pc/html/proj01',
                            '{$dev}/static/resource/pc/images/proj01',
                            '{$dev}/yyweb-web/src/main/webapp/static/pc/images/proj01',
                            '{$dev}/static/resource/pc/assets/proj01',
                            '{$dev}/yyweb-web/src/main/webapp/static/pc/assets/proj01'
                        ]

                    },
                    trunk: {
                        update: [
                            '{$trunk}'
                        ],
                        copy: {
                            '{$root}/js/proj02': [
                                '{$trunk}/static/resource/pc/js/proj02',
                                '{$trunk}/yyweb-web/src/main/webapp/static/pc/js/proj02'
                            ],
                            '{$root}/css/proj02': [
                                '{$trunk}/static/resource/pc/css/proj02',
                                '{$trunk}/yyweb-web/src/main/webapp/static/pc/css/proj02'
                            ],
                            '{$root}/html/proj02': [
                                '{$trunk}/static/resource/pc/html/proj02',
                                '{$trunk}/yyweb-web/src/main/webapp/static/pc/html/proj02'
                            ],
                            '{$root}/images/proj02': [
                                '{$trunk}/static/resource/pc/images/proj02',
                                '{$trunk}/yyweb-web/src/main/webapp/static/pc/images/proj02'
                            ],
                            '{$root}/assets/proj02': [
                                '{$trunk}/static/resource/pc/assets/proj02',
                                '{$trunk}/yyweb-web/src/main/webapp/static/pc/assets/proj02'
                            ]
                        },
                        commit: [
                            '{$trunk}/static/resource/pc/js/proj02',
                            '{$trunk}/yyweb-web/src/main/webapp/static/pc/js/proj02',
                            '{$trunk}/static/resource/pc/css/proj02',
                            '{$trunk}/yyweb-web/src/main/webapp/static/pc/css/proj02',
                            '{$trunk}/static/resource/pc/html/proj02',
                            '{$trunk}/yyweb-web/src/main/webapp/static/pc/html/proj02',
                            '{$trunk}/static/resource/pc/images/proj02',
                            '{$trunk}/yyweb-web/src/main/webapp/static/pc/images/proj02',
                            '{$trunk}/static/resource/pc/assets/proj02',
                            '{$trunk}/yyweb-web/src/main/webapp/static/pc/assets/proj02'
                        ]
                    }

                }
            }
            // - 此部分 不要用相对路径

        },
        proj02: {
            workflow: 'gulp-requirejs',
            name: projectName,
            version: version,
            dest: setting02.dest,
            proxy: setting02.proxy,

            onInitConfig: setting02.onInitConfig,
            onBeforeCommit: setting02.onBeforeCommit,

            // +此部分 yyl server 端config 会进行替换
            localserver: setting02.localserver,
            resource: { // 自定义项目中其他需打包的文件夹
                /*
                'src/swf': path.join(setting02.localserver.root, setting02.dest.basePath, 'swf'),
                'src/font': path.join(setting02.localserver.root, setting02.dest.basePath, 'font')
                 */

            },
            alias: { // yyl server 路径替换地方
                // svn dev 分支地址
                dev: path.join('../../../../../../svn.yy.com/yy-music/static/project/'+ projectName +'/branches/develop/pc'),
                // svn commit 分支地址
                commit: path.join('../../../../../../svn.yy.com/yy-music/static/project/'+ projectName +'/branches/commit/pc'),
                // svn trunk 分支地址
                trunk: path.join('../../../../../../svn.yy.com/yy-music/static/project/'+ projectName +'/trunk/pc'),

                // 公用组件地址
                commons: commonPath,

                // 公用 components 目录
                globalcomponents: path.join(commonPath, '../plugin/pc'),
                globallib: path.join(commonPath, 'lib'),


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
                revDest: path.join(setting02.localserver.root, setting02.dest.basePath, setting02.dest.revPath),

                rDemo: path.join('./src/proj02/components/r-demo/r-demo.js')
            },
            // -此部分 yyl server 端config 会进行替换

            // + 此部分 不要用相对路径
            // = 用 {$变量名} 方式代替, 没有合适变量可以自行添加到 alias 上
            concat: {
                
            },

            commit: {
                 // 上线配置
                revAddr: 'http://web.yystatic.com/project/'+ projectName +'/pc/assets/proj02/rev-manifest.json',
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
                            '{$root}/js/proj02': ['{$dev}/dist/js/proj02'],
                            '{$root}/css/proj02': ['{$dev}/dist/css/proj02'],
                            '{$root}/html/proj02': ['{$dev}/dist/html/proj02'],
                            '{$root}/images/proj02': ['{$dev}/dist/images/proj02'],
                            '{$root}/assets/proj02': ['{$dev}/dist/assets/proj02'],
                            '{$srcRoot}': ['{$dev}/src']
                        },
                        commit: [
                            '{$dev}/dist/js/proj02',
                            '{$dev}/dist/css/proj02',
                            '{$dev}/dist/html/proj02',
                            '{$dev}/dist/images/proj02',
                            '{$dev}/dist/assets/proj02',
                            '{$dev}/src'
                        ]

                    },
                    commit: {
                        update: [
                            '{$commit}'
                        ],
                        copy: {
                            '{$root}/js/proj02': ['{$commit}/js/proj02'],
                            '{$root}/css/proj02': ['{$commit}/css/proj02'],
                            '{$root}/html/proj02': ['{$commit}/html/proj02'],
                            '{$root}/images/proj02': ['{$commit}/images/proj02'],
                            '{$root}/assets/proj02': ['{$commit}/assets/proj02']
                        },
                        commit: [
                            '{$commit}/js/proj02',
                            '{$commit}/css/proj02',
                            '{$commit}/html/proj02',
                            '{$commit}/images/proj02',
                            '{$commit}/assets/proj02'
                        ]
                    },
                    trunk: {
                        update: [
                            '{$trunk}'
                        ],
                        copy: {
                            '{$root}/js/proj02': ['{$trunk}/js/proj02'],
                            '{$root}/css/proj02': ['{$trunk}/css/proj02'],
                            '{$root}/html/proj02': ['{$trunk}/html/proj02'],
                            '{$root}/images/proj02': ['{$trunk}/images/proj02'],
                            '{$root}/assets/proj02': ['{$trunk}/assets/proj02']
                        },
                        commit: [
                            '{$trunk}/js/proj02',
                            '{$trunk}/css/proj02',
                            '{$trunk}/html/proj02',
                            '{$trunk}/images/proj02',
                            '{$trunk}/assets/proj02'
                        ]
                    }

                }
            }
            // - 此部分 不要用相对路径

        }
        
    };

module.exports = config;
