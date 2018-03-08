# gulp-requirejs workflow

## 环境说明
本项目基于 yyl 组件进行搭建， 运行前需全局安装:
```
npm install yyl -g
npm install gulp -g
```

## 命令说明
```
Useage: yyl <command>

Commands:
    watch     打包并建立本地服务器监听文件
    watchAll  打包并建立本地服务器监听文件
    all       打包文件
    html      单独打包 html 部分代码
    css       单独打包 html 部分代码
    js        单独打包 js 部分代码
    images    单独打包 images 部分代码
    connect   生成本地服务器
    commit    打包并提及到服务器(config.js 中设置)

Options:
    --name <name>    用于存在个多项目的工程，
                     name: 与config 里面的 配置保持一致

    --ver <remote>   线上rev-manifest 版本
                     remote: 版本信息 如直接拉取最新版 输入 'remote'
    --remote         同 --ver remote

    --sub <branch>   发布的版本 dev|trunk

    --proxy          开启本地代理服务(需要配置 config.proxy 参数)
    --logLevel       log 级别， 目前 loglevel > 1 时 proxy 会输出 代理的详细信息
    --config         自定义 config 文件
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
若包含多个子工程 请在 构建命令的最后加上 `--name <name>`

## 关于本地代理
在 `config.proxy` 设置 相关参数后，即可通过本地代理的方式对代码进行本地映射到线上,
构建工具默认会将 `config.commit.hostname`  映射到啊 本地服务器根目录
```
{
    proxy: {
        port: 8887,
        localRemote: {
            'http://www.yy.com': './dist'
        },
        ignores: []
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
            },
            // 不进行代理的地址列表
            ignores: [
              'http://www.yy.com/'
            ]
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
        // yyl server 路径替换地方能对应各自的自定义变量 如 alias.dev => {$dev}
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

##  项目开发规范
本工作流采取 组件化开发流程， 所有 页面， 控件都基于 components 目录内 组件 的互相引入,调用， 最终生成对应页面的 html, js, css




### 页面 组件 p-xx 开发规范

#### 构建流程介绍
p-xx 类组件属于页面级别组件，在生成时 会有自己独立的 html, js, css 分别在 html, css, js 目录下 如 p-demo 生成后会出现在：

```
|~html
| `- demo.html
|~css
| `- demo.css
`~js
  `- demo.js
```


#### 命名规范
项目中规定 p-xx 采用 单词+ 横杠方式命名如 p-liveplayer-toolbar, 组件目录下的 jade, scss, js 文件命名与 文件目录保持一致如:

```
p-liveplayer-toolbar
|- p-liveplayer-toolbar.js
|- p-liveplayer-toolbar.jade
|- p-liveplayer-toolbar.scss
|+ images
```

#### 开发范例
* p-xx.jade 文件开发范例[点击这里](./src/components/p-demo/p-demo.jade)
* p-xx.scss 文件开发范例[点击这里](./src/components/p-demo/p-demo.scss)
* p-xx.js   文件开发范例[点击这里](./src/components/p-demo/p-demo.js)

其中 样式中 图片的引入直接基于当前目录进行引入即可， 构建工具会自动纠正如：

需要引入当前 images 目录下的 logo.png
```
p-liveplayer-toolbar
|- p-liveplayer-toolbar.js
|- p-liveplayer-toolbar.jade
|- p-liveplayer-toolbar.scss
|~ images
   ` logo.png
```

直接这样写
```
.logo {
    background: url('./images/logo.png');
}
```
而 jade 文件中的图片 则是基于被引入的 p-xx.jade 文件为准，如:

```
|- p-liveplayer-toolbar
|  |- p-liveplayer-toolbar.jade
|  `- ...
`- w-demo
   |- w-demo.jade
   `- images
      `- logo.png
```

若在 w-demo.jade 中想引入 当前目录下的 `images/logo.png`, 则需要 以 被引入的 p-xx.jade 为准：
```
// p-liveplayer-toolbar.jade 中
@include ../w-demo.jade
```

```
// w-demo.jade 中
img(src="../w-demo/images/logo.png")
```
### js 组件 j-xx 开发规范

#### 构建流程介绍
j-xx 类组件属于js 级别组件，在生成时 会有自己独立的 js 在 js 目录下 如 j-vendors 生成后会出现在：

```
`~js
  `- vendors.js
```

#### 命名规范
命名规范同 p-xx


### 模块 组件 w-xx(r-xx) 开发规范

#### 构建流程介绍
w-xx(r-xx) 类组件属于组件级别 组件，在生成时 `不会有` 自己独立的 html, js, css, 只有在被 引用的时候才会把对应的 scss, js, jade 合并到 引用方。

#### scss 编写规范
由于 组件中 scss 是通过 p-xx 页面级组件进行引入，为了避免出现 组件引用了 但实际上并没有使用的情况， 我们需要 在 编写 w-xx.scss 部分时 定义一个 mixin 方法，名称取当前组件名称，而由于w-xx 是被 p-xx 引入，所以路径都会以 p-xx 所在路径为基准，而不是以 w-xx 路径 为基准，所以需要在mixin 把当前路径带上去，才能在 w-xx 组件中正确指向 当前路径，举个例子

在 p-demo.scss 中 引入 w-demo.scss 我们需要这样写:

目录如下:
```
components
|~ p-demo
|  |- p-demo.scss
|  `- ...
`~ w-demo
   |- w-demo.scss
   |~ images
   |  `- logo.png
   `- ...
```

内容：

```
// p-demo.scss
@import "../../components/w-demo/w-demo";
@include w-demo('../../components/w-demo');
```

在 w-demo.scss 我们这样使用 
```
@mixin w-demo($path){
    .w-demo-logo {
        background: url($path + '/images/logo.png?' + $cssjsdate) no-repeat;
    }
}
```

#### 命名规范
命名规范同 p-xx

#### 开发范例
* w-xx.jade 文件开发范例[点击这里](./src/components/r-demo/r-demo.jade)
* w-xx.scss 文件开发范例[点击这里](./src/components/r-demo/r-demo.scss)
* w-xx.js   文件开发范例[点击这里](./src/pc/components/w-demo/w-demo.js)

### 关于测试数据

测试数据(模拟接口返回)统一存放在 js/data/ 目录下的 json 文件
```
|+ dist
`- src
   `- js
      `- data
         `- test.json
```

工程将会把这测试数据同步到 dist 下 js 对应目录


### 更新记录

#### 1.0.0 - 2016.12.01
* [ADD] 诞生

