'use strict';
var 
    //+ yyl init 自动 匹配内容
    commonPath = /*+commonPath*/'../../../../public/global'/*-commonPath*/,
    projectName = /*+name*/'workflow_demo'/*-name*/,
    version = /*+version*/'1.0.0'/*-version*/,
    //- yyl init 自动 匹配内容
    path = require('path'),
    settings = [{
        // 若存在 多个 setting 此 name 属性会作为 --name 后参数
        name: projectName,
        // 工作流类型
        workflow: 'browserify-babel',

        localserver: { // 本地服务器配置
            root: './dist', // 服务器输出地址
            port: 5000 // 服务器 port
        },

        // 需要构建工具额外安装的 npm 组件放这里 如 axios
        plugins: [],

        dest: {
            basePath: '/project/'+ projectName +'/pc',
            jsPath: 'js',
            jslibPath: 'js/lib',
            cssPath: 'css',
            htmlPath: 'html',
            imagesPath: 'images',
            revPath: 'assets'
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
            srcRoot: './src'
        },
        // -此部分 yyl server 端config 会进行替换

        // + 此部分 不要用相对路径
        // = 用 {$变量名} 方式代替, 没有合适变量可以自行添加到 alias 上
        concat: {

        },
        commit: {
             // 上线配置
            revAddr: 'http://web.yystatic.com/project/'+ projectName +'/pc/assets/rev-manifest.json',
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
                commit: {
                    update: [
                        '{$commit}'
                    ],
                    copy: {
                        '{$root}/js': ['{$commit}/js'],
                        '{$root}/css': ['{$commit}/css'],
                        '{$root}/html': ['{$commit}/html'],
                        '{$root}/images': ['{$commit}/images'],
                        '{$root}/assets': ['{$commit}/assets']
                    },
                    commit: [
                        '{$commit}/js',
                        '{$commit}/css',
                        '{$commit}/html',
                        '{$commit}/images',
                        '{$commit}/assets'
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
