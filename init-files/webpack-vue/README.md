# webpack-vue workflow

## 环境说明
本项目基于 yyl 组件进行搭建， 运行前需全局安装:
```
npm install yyl -g
```

## 命令说明
```
Useage: yyl <command>

Commands:
    watch     打包并建立本地服务器监听文件
    all       打包文件
    commit    打包并提及到服务器(config.js 中设置)

Options:
    --ver <remote>   线上rev-manifest 版本
                     remote: 版本信息 如直接拉取最新版 输入 'remote'

    --sub <branch>   发布的版本 dev|trunk

    --proxy          开启本地代理服务(需要配置 config.proxy 参数)
    --silent         不显示右下角小气泡
```
### 构建例子
```
# 构建单个项目
yyl watch --sub dev --proxy

# 调试线上代码
yyl watch --name pc --sub dev --ver remote --proxy

# 提交到 dev
yyl commit --sub dev

# 提交到 trunk
yyl commit --sub trunk
```

## 关于本地代理
在 `config.proxy` 设置 相关参数后，即可通过本地代理的方式对代码进行本地映射到线上,
构建工具默认会将 `config.commit.hostname`  映射到啊 本地服务器根目录
```
{
    proxy: {
        port: 8887,
        localRemote: {
            'http://www.yy.com': './dist'
        }

    }
}
```

设置完config 后需要 对 浏览器进行 代理设置，让浏览器通过构建工具提供的端口进行页面访问如 `http://127.0.0.1:8887`
`chrome` 可以通过 安装插件 `SwitchySharp` 来进行 代理设置， ie 可以通过 `工具 -> internet 选项 -> 链接 -> 局域网设置 -> 代理服务器`
中进行设置

## 项目配置文件 config.js 
config 配置文件用于配置 `yyl` 工作流 的 打包规则, 提交路径等相关信息, 配置解析如下:
```js
var 
    config = {

        // 打包方式配置
        workflow: 'gulp-requirejs',

        // 项目名称
        name: 'yy.com',

        // 项目版本
        version: '1.0.0',

        // 打包生成相关配置
        dest: {
            // 基础目录 
            // - 如需要输出的 js 目录为 /pc/js/a.js, css 目录为 pc/css/a.css
            // - 那我们就可以把 basePath 设置为 /pc
            basePath: '/pc',

            // js 输出路径. 此配置会加上 basePath 作为前缀
            jsPath: 'js',

            // jslib 输出路径. 此配置会加上 basePath 作为前缀
            jslibPath: 'js/lib',

            // css 输出路径. 此配置会加上 basePath 作为前缀
            cssPath: 'css',

            // html 输出路径. 此配置会加上 basePath 作为前缀
            htmlPath: 'html',

            // images 输出路径. 此配置会加上 basePath 作为前缀
            imagesPath: 'images',

            // rev-manifest 映射表 输出路径. 此配置会加上 basePath 作为前缀
            revPath: 'assets'
        },
        // 本地代理相关配置
        proxy: {
            // 代理端口
            port: 8887,
            // 映射规则
            localRemote: {
                // 可以相对路径
                'http://www.yy.com/': './dist/',
                // 也可以绝对路径
                'http://www.yy.com/': 'http://127.0.0.1:5000/'
            }
        },
        // + 此部分 yyl server 端config 会进行替换
        // 本地服务器配置
        localserver: {
            // 服务器输出地址
            root: './dist', 
            // 服务器 port
            port: 5000
        },
        // 自定义项目中其他需打包的文件夹
        resource: {
            'src/swf': path.join(setting.localserver.root, setting.dest.basePath, 'swf'),
            'src/font': path.join(setting.localserver.root, setting.dest.basePath, 'font')
        },
        // 对应 webpack.config 中 entry 字段
        entry: {
            vendors: ['flexlayout']
        },
        // yyl server 路径替换地方能对应各自的自定义变量 如 alias.dev => {$dev}
        // 也对应 webpack config 中的 alias
        alias: {
            // svn dev 分支地址
            dev: path.join('../../../svn.yy.com/yy-music/web-dragon/star-fans/yyweb/branches/develop'),
            ..
        },
        // - 此部分 yyl server 端config 会进行替换
        // + 此部分 不要用相对路径
        // = 用 {$变量名} 方式代替, 没有合适变量可以自行添加到 alias 上
        // 文件合并规则设置
        concat: {
            '{$jsDest}/headfoot.mix.js': [
                '{$srcRoot}/js/lib/duowan/duowan.min.js',
                '{$srcRoot}/js/lib/websdk/websdk.js',
                '{$srcRoot}/js/headfoot.js'

            ]
        },

        // 提交操作相关配置
        commit: {
            // 线上 rev-manifest 路径设置
            revAddr: 'http://yyweb.yystatic.com/pc/assets/rev-manifest.json',
            // 静态资源 域名设置
            hostname: 'http://yyweb.yystatic.com/',
            // svn 相关配置
            svn: {
                // 对应 dev 分支
                dev: {
                    // 执行 svn update 的路径
                    update: [
                        '{$dev}/static',
                        '{$dev}/yyweb-web/src/main/webapp/WEB-INF/jsp-tmpl'
                        ...
                    ],
                    // 拷贝规则
                    copy: {
                        '{$root}/js': [
                            '{$dev}/static/resource/pc/js',
                            '{$dev}/yyweb-web/src/main/webapp/static/pc/js'
                        ],
                        ...
                    },
                    // 执行 svn commit 的路径
                    commit: [
                        '{$dev}/static/resource/pc/js',
                        ...
                    ],
                    /** 
                     * 提交之前回调函数
                     * @param {String}   type 当前提交的分支 dev|trunk
                     * @param {Function} next 处理完执行的 next 让程序继续往下跑
                     */
                    onBeforeCommit: function(type, next){
                        var 
                            iConfig = config,
                            localAssetPath = path.join(iConfig.alias.revDest, 'rev-manifest.json'),
                            serverAssetPath = path.join(iConfig.alias[type], '../assets/rev-manifest.json');

                        if(fs.existsSync(localAssetPath) && fs.existsSync(serverAssetPath)){
                            try {
                                var 
                                    localData = JSON.parse(fs.readFileSync(localAssetPath)),
                                    serverData = JSON.parse(fs.readFileSync(serverAssetPath));

                                for(var key in localData){
                                    if(localData.hasOwnProperty(key)){
                                        serverData[key] = localData[key];
                                    }
                                }

                                fs.writeFileSync(serverAssetPath, JSON.stringify(serverData, null, 4));

                                console.log('==================');
                                console.info('update assets file done');
                                console.log(serverAssetPath);
                                console.log(JSON.stringify(serverData, null, 4));
                                console.log('==================');
                                next();

                            } catch(er){
                                console.error('write assets file fail', er);
                            }

                        }

                    }

                },
                // 对应 trunk 分支
                trunk: {
                    ...
                }

            }

        }
        // - 此部分 不要用相对路径

        


    };

```

## 自定义配置文件
我们如果对 `config.js` 配置不符合本地的一些实际情况，如文件路径，可以建一个本地的配置文件`config.mine.js`来进行适配，而此文件并不会上传到git
1. 在根目录 创建 `config.mine.js` 文件
2. 把要 config.js 中需要自定义的 属性 存放在 config.mine.js 文件。 demo 如下

```js
'use strict';
var path = require('path');

module.exports = {
    alias: {
        // svn dev 分支地址
        dev: path.join('../../../../../../svn.yy.com/yy-music/static/project/workflow_demo/branches/develop/pc'),
        // svn commit 分支地址
        commit: path.join('../../../../../../svn.yy.com/yy-music/static/project/workflow_demo/branches/commit/pc'),
        // svn trunk 分支地址
        trunk: path.join('../../../../../../svn.yy.com/yy-music/static/project/workflow_demo/trunk/pc')
    }
};
```

## 工作流简介
本前端工程采用 vue 1.x + vue-router + vuex 技术架构，通过 webpack 进行整合打包， 把 css 部分通过插件抽离成独立样式表， 并会针对输出的文件生成一份 rev-manifest 文件哈希映射表 给后端使用。适用于移动端 单页面应用场景。

## webpack.config 中的 alias 配置
本前端工程才有 webpack 进行 打包， webpack.config.js 中 alias 选项已整合到 config 中同名属性 alias 当中。

详情可见 [with-global-component](../../examples/webpack-vue/with-global-component) demo

## 入口文件 - boot
* 本前端工程 整个项目的 入口文件是 boot/boot.js, 其他页面都是通过 boot.js 中的 vue-router 路由功能 实现切换替代。
* boot/boot.jade 中的代码在进行 webpack 打包时，会被webpack 中的 插件 独立生成为 单独的 boot.html


## 页面 组件 p-xx 开发规范

### 命名规范
项目中的 页面组件 这边定义需要统一放在 components/page/ 目录下，

采用 单词+ 横杠方式命名如 p-liveplayer-toolbar, 组件目录下的 jade, scss, js 文件命名与 文件目录保持一致如:

```
src
|~ components
|  |- page
|  |  |- p-liveplayer-toolbar
|  |  |  |- p-liveplayer-toolbar.js
|  |  |  |- p-liveplayer-toolbar.jade
|  |  |  |- p-liveplayer-toolbar.scss
|  |  |  `+ images
|  |  `- ...
|  `- widget
|- ...
```

### 开发范例
* p-xx.jade 文件开发范例[点击这里](./src/components/page/p-index/p-index.jade)
* p-xx.scss 文件开发范例[点击这里](./src/components/page/p-index/p-index.scss)
* p-xx.js   文件开发范例[点击这里](./src/components/page/p-index/p-index.js)

## 功能 组件 v-xx 开发规范

### 命名规范
项目中的 页面组件 这边定义需要统一放在 components/widget/ 目录下，

采用 单词+ 横杠方式命名如 v-liveplayer-toolbar, 组件目录下的 jade, scss, js 文件命名与 文件目录保持一致如:

```
src
|~ components
|  |- page
|  `- widget
|     |- v-liveplayer-toolbar
|     |  |- v-liveplayer-toolbar.js
|     |  |- v-liveplayer-toolbar.jade
|     |  |- v-liveplayer-toolbar.scss
|     |  `+ images
|     `- ...
|- ...
```


#### 开发范例
* v-xx.jade 文件开发范例[点击这里](./src/components/widget/v-demo/v-demo.jade)
* v-xx.scss 文件开发范例[点击这里](./src/components/widget/v-demo/v-demo.scss)
* v-xx.js   文件开发范例[点击这里](./src/pc/components/widget/v-demo/v-demo.js)
