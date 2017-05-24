# gulp-requirejs workflow

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

    --sub <branch>   发布的版本 dev|trunk
    --proxy          开启本地代理服务(需要配置 config.proxy 参数)
```

## 关于本地代理
在 config.proxy 设置 相关参数后，即可通过本地代理的方式对代码进行本地映射到线上,
构建工具默认会将 config.commit hostname 映射到啊 本地服务器根目录
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

设置完config 后需要 对 浏览器进行 代理设置，让浏览器通过构建工具提供的端口进行页面访问如 http://127.0.0.1:8887
chrome 可以通过安装插件 SwitchySharp 来进行 代理设置， ie 可以通过 工具 -> internet 选项 -> 链接 -> 局域网设置 -> 代理服务器
中进行设置

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

### 更新记录

#### 1.0.0 - 2016.12.01
* [ADD] 诞生

