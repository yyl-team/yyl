'use strict';
var 
    //+ yyl init 自动 匹配内容
    commonPath = /*+commonPath*/'../../../../public/global'/*-commonPath*/,
    projectName = /*+name*/'workflow_demo'/*-name*/,
    version = /*+version*/'1.0.0'/*-version*/,
    //- yyl init 自动 匹配内容
    path = require('path'),
    settings = [{
        // 若存在 多个 setting 此 name 属性会作为
        name: 'proj01',
        // 工作流类型
        workflow: 'rollup',

        localserver: { // 本地服务器配置
            root: './dist', // 服务器输出地址
            port: 5000 // 服务器 port
        },

        // 代理服务器
        proxy: {
            port: 8887,
            localRemote: {
                'http://www.yy.com/': './dist/'
            }
        },

        dest: {
            basePath: '/project/'+ projectName +'/pc',
            jsPath: 'js/proj01',
            jslibPath: 'js/proj01/lib',
            cssPath: 'css/proj01',
            htmlPath: 'html/proj01',
            imagesPath: 'images/proj01',
            revPath: 'assets/proj01',
        },
        // 别名配置
        // +此部分 yyl server 端config 会进行替换
        alias: {
            // svn dev 分支地址
            dev: path.join('./'),
            // svn commit 分支地址
            commit: path.join('../../commit/pc'),
            // svn trunk 分支地址
            trunk: path.join('../../../trunk/pc'),
            // 公用 components 目录
            globalcomponents: path.join(commonPath, '../plugin/pc'),
            // 公用 lib 目录
            globallib: path.join(commonPath, 'lib'),
            // src 地址
            srcRoot: 'src/proj01'
        },
        // -此部分 yyl server 端config 会进行替换

        // + 此部分 不要用相对路径
        // = 用 {$变量名} 方式代替, 没有合适变量可以自行添加到 alias 上
        concat: {

        },
        commit: {
            // 上线配置
            revAddr: 'http://web.yystatic.com/project/'+ projectName +'/pc/assets/proj01/rev-manifest.json',
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
                commit: {
                    update: [
                        '{$commit}'
                    ],
                    copy: {
                        '{$root}/js/proj01': ['{$commit}/js/proj01'],
                        '{$root}/css/proj01': ['{$commit}/css/proj01'],
                        '{$root}/html/proj01': ['{$commit}/html/proj01'],
                        '{$root}/images/proj01': ['{$commit}/images/proj01'],
                        '{$root}/assets/proj01': ['{$commit}/assets/proj01']
                    },
                    commit: [
                        '{$commit}/js/proj01',
                        '{$commit}/css/proj01',
                        '{$commit}/html/proj01',
                        '{$commit}/images/proj01',
                        '{$commit}/assets/proj01'
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

        },
        // - 此部分 不要用相对路径
        // 提交之前回调函数
        beforeCommit: function(){}
    }, {
        // 若存在 多个 setting 此 name 属性会作为
        name: 'proj02',
        // 工作流类型
        workflow: 'rollup',

        localserver: { // 本地服务器配置
            root: './dist', // 服务器输出地址
            port: 5000 // 服务器 port
        },

        // 代理服务器
        proxy: {
            port: 8887,
            localRemote: {
                'http://www.yy.com/': './dist/'
            }
        },

        dest: {
            basePath: '/project/'+ projectName +'/pc',
            jsPath: 'js/proj02',
            jslibPath: 'js/proj02/lib',
            cssPath: 'css/proj02',
            htmlPath: 'html/proj02',
            imagesPath: 'images/proj02',
            revPath: 'assets/proj02',
        },
        // 别名配置
        // +此部分 yyl server 端config 会进行替换
        alias: {
            // svn dev 分支地址
            dev: path.join('./'),
            // svn commit 分支地址
            commit: path.join('../../commit/pc'),
            // svn trunk 分支地址
            trunk: path.join('../../../trunk/pc'),
            // 公用 components 目录
            globalcomponents: path.join(commonPath, '../plugin/pc'),
            // 公用 lib 目录
            globallib: path.join(commonPath, 'lib'),
            // src 地址
            srcRoot: 'src/proj02'
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

        },
        // - 此部分 不要用相对路径
        // 提交之前回调函数
        beforeCommit: function(){}
    }];

var config = {};

function extendit(o1, o2){
    for(var key in o2){
        if(o2.hasOwnProperty(key)){
            o1[key] = o2[key];
        }
    }
    return o1;
}

function settingPrase(setting){
    return {
        workflow: setting.workflow,
        name: setting.name,
        version: version,
        dest: setting.dest,
        localserver: setting.localserver,
        proxy: setting.proxy,
        alias: extendit({
            // 公用组件地址
            commons: commonPath,

            // 输出目录中 到 html, js, css, image 层 的路径
            root: path.join(setting.localserver.root, setting.dest.basePath),

            // rev 输出内容的相对地址
            revRoot: path.join(setting.localserver.root, setting.dest.basePath),

            // dest 地址
            destRoot: setting.localserver.root,

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

        }, setting.alias),
        concat: setting.concat,
        commit: setting.commit,
        beforeCommit: setting.beforeCommit
    };
}

if(settings.length === 1){
    config = settingPrase(settings[0]);

} else {
    settings.forEach(function(setting){
        if(setting.name){
            config[setting.name] = settingPrase(setting);
        }
    });

}

module.exports = config;
