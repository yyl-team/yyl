'use strict';
var 
    //+ yyl init 自动 匹配内容
    commonPath = '../../../../public/global',
    projectName = 'multi-project',
    //- yyl init 自动 匹配内容
    path = require('path'),
    setting01 = {
        localserver: { // 本地服务器配置
            root: './dist', // 服务器输出地址
            port: 5000 // 服务器 port
        },
        dest: {
            basePath: '/project/workflow_demo/pc',
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
            basePath: '/project/workflow_demo/pc',
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
            workflow: 'browserify-babel',
            name: projectName,
            dest: setting01.dest,
            // +此部分 yyl server 端config 会进行替换
            localserver: setting01.localserver,
            alias: { // yyl server 路径替换地方
                // svn dev 分支地址
                dev: path.join('../../../../../../svn.yy.com/yy-music/static/project/workflow_demo/branches/develop/pc'),
                // svn commit 分支地址
                commit: path.join('../../../../../../svn.yy.com/yy-music/static/project/workflow_demo/branches/commit/pc'),
                // svn trunk 分支地址
                trunk: path.join('../../../../../../svn.yy.com/yy-music/static/project/workflow_demo/trunk/pc'),


                // 公用组件地址
                commons: commonPath,

                // 公用 components 目录
                globalcomponents: path.join(commonPath, '../plugin/pc'),
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
                revDest: path.join(setting01.localserver.root, setting01.dest.basePath, setting01.dest.revPath)
            },
            // -此部分 yyl server 端config 会进行替换

            // + 此部分 不要用相对路径
            // = 用 {$变量名} 方式代替, 没有合适变量可以自行添加到 alias 上
            concat: {
            },

            commit: {
                 // 上线配置
                revAddr: 'http://web.yystatic.com/project/workflow_demo/pc/assets/proj01/rev-manifest.json',
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
                            '{$root}/js/proj01': ['{$dev}/dist/js/proj01'],
                            '{$root}/css/proj01': ['{$dev}/dist/css/proj01'],
                            '{$root}/html/proj01': ['{$dev}/dist/html/proj01'],
                            '{$root}/images/proj01': ['{$dev}/dist/images/proj01'],
                            '{$root}/assets/proj01': ['{$dev}/dist/assets/proj01'],
                            '{$srcRoot}': ['{$dev}/src']
                        },
                        commit: [
                            '{$dev}/dist/js/proj01',
                            '{$dev}/dist/css/proj01',
                            '{$dev}/dist/html/proj01',
                            '{$dev}/dist/images/proj01',
                            '{$dev}/dist/assets/proj01',
                            '{$dev}/src'
                        ]

                    },
                    trunk: {
                        update: [
                            '{$trunk}'
                        ],
                        copy: {
                            '{$root}/js/proj01': ['{$trunk}/js/proj01'],
                            '{$root}/css/proj01': ['{$trunk}/css/proj01'],
                            '{$root}/html/proj01': ['{$trunk}/html/proj01'],
                            '{$root}/images/proj01': ['{$trunk}/images/proj01'],
                            '{$root}/assets/proj01': ['{$trunk}/assets/proj01']
                        },
                        commit: [
                            '{$trunk}/js/proj01',
                            '{$trunk}/css/proj01',
                            '{$trunk}/html/proj01',
                            '{$trunk}/images/proj01',
                            '{$trunk}/assets/proj01'
                        ]
                    }

                }
            }
            // - 此部分 不要用相对路径

        },
        proj02: {
            workflow: 'browserify-babel',
            name: projectName,
            dest: setting02.dest,
            // +此部分 yyl server 端config 会进行替换
            localserver: setting02.localserver,
            alias: { // yyl server 路径替换地方
                // svn dev 分支地址
                dev: path.join('../../../../../../svn.yy.com/yy-music/static/project/workflow_demo/branches/develop/pc'),
                // svn commit 分支地址
                commit: path.join('../../../../../../svn.yy.com/yy-music/static/project/workflow_demo/branches/commit/pc'),
                // svn trunk 分支地址
                trunk: path.join('../../../../../../svn.yy.com/yy-music/static/project/workflow_demo/trunk/pc'),

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
                revDest: path.join(setting02.localserver.root, setting02.dest.basePath, setting02.dest.revPath)
            },
            // -此部分 yyl server 端config 会进行替换

            // + 此部分 不要用相对路径
            // = 用 {$变量名} 方式代替, 没有合适变量可以自行添加到 alias 上
            concat: {
                
            },

            commit: {
                 // 上线配置
                revAddr: 'http://web.yystatic.com/project/workflow_demo/pc/assets/proj02/rev-manifest.json',
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
