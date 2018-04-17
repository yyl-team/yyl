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
    --logLevel       log 级别， 目前 loglevel > 1 时 proxy 会输出 代理的详细信息
    --config         自定义 config 文件
```
### 构建例子
```
# 构建单个项目
yyl watch --proxy

# 调试线上代码
yyl watch --proxy --remote

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

## 集成组件
* pug-loader
* sass-loader
* postcss-loader
* autoprefixer
* postcss-px2rem

## webpack.config 中的 alias 配置
本前端工程才有 webpack 进行 打包， webpack.config.js 中 alias 选项已整合到 config 中同名属性 alias 当中。

详情可见 [with-global-component](../../examples/webpack-vue/with-global-component) demo

## 入口文件 - boot
* 本前端工程 整个项目的 入口文件是 boot/boot.js, 其他页面都是通过 boot.js 中的 vue-router 路由功能 实现切换替代。
* boot/boot.jade 中的代码在进行 webpack 打包时，会被webpack 中的 插件 独立生成为 单独的 boot.html

## 多入口文件 - entry
* 本工程可设置多个独立的入口文件，目录如下
```
src
|~ entry
|  |- index
|  |  |- index.pug
|  |  |- index.scss
|  |  |- index.js
|  |  `- images
|  `- sub
|- ...
```

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
