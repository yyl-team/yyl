# yylive work flow 说明文档
## 环境说明
项目基于 `node, gulp, svn, git` 搭建, 需要在 `node >= 4.0.0` 环境下运行
* 需要 node  `>= 4.0.0`
* 需要 svn `命令行安装` (在 cmd/终端 操作 输入 `svn` 有东西)
* 需要 git `命令行安装` (在 cmd/终端 操作 输入 `git` 有东西)
* mac 用户 svn 提交需要注意 cmd svn 版本 和 软件 svn 版本是否一致

## 安装
```
npm install yyl -g
```

## 命令说明


### 整体说明
```
Useage: yyl <command>

Commands:
    init    项目初始化
    watch   执行打包并建立本地服务器监听
    all     执行打包操作
    server  yyl本地服务相关命令


Options:
    -h, --help    帮助信息
    -v, --version 版本信息
    -p, --path    本程序目录
```

### 项目初始化相关命令
```shell
Useage: yyl init

Commands:

Options:
    -h, --help    帮助信息
    -f,           不管当前目录下有没文件，直接覆盖
```

### 压缩相关命令
```
Useage: yyl <command>

Commands:
    watch     打包并建立本地服务器监听文件
    watchAll  打包并建立本地服务器监听文件
    all       打包文件

Options:
    --name <name>    用于存在个多项目的工程，
                     name: 与config 里面的 配置保持一致

    --ver <remote>   线上rev-manifest 版本
                     remote: 版本信息 如直接拉取最新版 输入 'remote'
```

### 提交相关命令
```
Useage: yyl commit <command>

Commands:

Options:
    --name <name>    用于存在个多项目的工程，
                     与config 里面的 配置保持一致

    --sub <branches> 分支信息用于 执行 commit 操作 或者 
                     在 watch 时 生成和服务器 rev-manifest 一样资源文件

    --nosvn          不执行 svn 相关操作
```

### 本地服务相关命令
```
Useage: yyl server <command>

Commands:
    init <workflow>  本地服务初始化
                     workflow 需要初始化的工作流 gulp-requirejs|vue-webpack

    clear            清空本地服务文件夹

    start            在当前文件夹建立本地服务器

Options:
    -h, --help    帮助信息
    -p, --path    打开本地服务所在路径
```

### 例子相关命令
```
Useage: yyl example <command>

```

### 删除文件相关命令
可以帮助快速删掉 node_modules 文件夹 `yyl rm node_modules`
```
Useage: yyl rm <dirname>

```


## 程序工作机制说明
1. 在执行 程序初始化时, 根据你选的架构类型, 程序会在 一个存放本程序资源的地方 (~/.yyl) 里面创建对应架构类型的文件夹如(~/.yyl/init-file/gulp-requirejs/), 并在里面 根据架构依赖进行 npm install, 从而达到多个项目共用同一份 node_modlues 目的

2. 在执行压缩(all)、提交操作(commit)时, 程序会根据当前项目中的 config.js, config.mine.js 中的内容 替换里面的路径(如 程序中的 ./src 会替换成 h:/work/proj01/src) 在 本程序资源目录中生成一份如(~/.yyl/init-file/gulp-requirejs/config.js), 压缩、 提交操作 实际上是通过 程序资源目录中的 gulp 来执行。 这样就可以实现在项目中保持目录简洁的需求。



## workflow 说明

### gulp-requirejs
requirejs 技术架构, 适用于 PC 端开发

#### 说明文档
* [说明文档](./init-files/gulp-requirejs/README.md)

#### 例子
* [hello world](./examples/gulp-requirejs/single-project)
* [引入公用库资源](./examples/gulp-requirejs/with-global-component)
* [一个项目集成多个子工程例子](./examples/gulp-requirejs/multi-project)
* [非 components 模式开发例子](./examples/gulp-requirejs/no-components)

### browserify-babel
es6 + browserify 技术架构, 适用于 PC 端开发

#### 说明文档
* [说明文档](./init-files/browserify-babel/README.md)

#### 例子
* [hello world](./examples/browserify-babel/single-project)
* [引入公用库资源](./examples/browserify-babel/with-global-component)
* [一个项目集成多个子工程例子](./examples/browserify-babel/multi-project)
* [非 components 模式开发例子](./examples/browserify-babel/no-components)

### webpack-vue
适用于 移动端开发

#### 说明文档
* [说明文档](./init-files/webpack-vue/README.md)

#### 例子
* [hello world](./examples/webpack-vue/single-project)
* [引入公用库资源](./examples/webpack-vue/with-global-component)
* [es6 模式开发例子](./examples/webpack-vue/es6)
* [多入口例子](./examples/webpack-vue/multi-project)
* [带自定义 webpack.config 例子](./examples/webpack-vue/local-webpackconfig)

## 版本信息

### 2.0.5 (2017-03-28)
* [FIX] 修复 yyl 初始化时 由于 yyl 全局安装是处在 node_modules 文件夹下， 而拷贝文件时又设置了 跳过 node_modules 文件夹的操作， 导致拷贝失败问题

### 2.0.4 (2017-03-28)
* [FIX] 修复 yyl 初始化组件时 只生成 dist 空文件问题

### 2.0.3 (2017-03-27)
* [ADD] 新增组件 调试命令 yyl debug

### 2.0.2 (2017-03-27)
* [FIX] 修改 bin/init.js 文件格式为 unix (修复mac 系统下安装完会出错问题)

### 2.0.1 (2017-03-09)
* [EDIT] 修改 package.json 组件依赖

### 2.0.0 (2017-03-09)
* [EDIT] yyl 命令安装改为通过 npm install yyl 方式全局安装
* [DEL]  去除 yyl update 方法

### 1.12.1 (2017-02-23)
* [FIX]  去掉安装/ 卸载时对 yyl-util 的依赖

### 1.12.0 (2017-01-11)
* [EDIT] 将 yyl-util, yyl-color 提取到 npm 上面

### 1.12.0 (2017-01-11)
* [EDIT] 将 yyl-util, yyl-color 提取到 npm 上面

### 1.11.2 (2017-01-09)
* [ADD] vue-webpack 支持 多个entry 中 单独渲染 自己的 css 文件
* [FIX] 修复 vuewebpack 里面 jade 模板渲染不了问题
* [FIX] 修复 vuewebpack 里面 css 文件名称 不跟 entry 定义问题
* [FIX] 修复 vue-webpack demo 中 no-component 里面 head标签 缺少闭合问题

### 1.11.0 (2017-01-06)
* [ADD] yyl rm 句柄，方便卸载 node_modules 文件
* [ADD] 新增 软件卸载用 uninstall.bat, uninstall.sh 文件
* [EDIT] 将组件 安装, 卸载 改用 命令行代替

### 1.10.0 (2017-01-05)
* [FIX] 修复程序在 node 5+ 上面 运行缺失部分 nodecomponents 的问题
* [ADD] webpack-vue 下 html 文件 新增 可直接 用 img 标签引用 图片
* [ADD] 新增 yyl example 命令

### 1.9.0 (2017-01-05)
* [ADD] vue-webpack 类工作流 新增 no-components 模式

### 1.8.0 (2017-01-03)
* [ADD] yyl config 下 如设置 config.commit.revAddr 为空 or false, 则不会生成 md5相关文件

### 1.7.0 (2016-12-30)
* [ADD] yyl webpack-vue 下 js 目录下也支持 打包输出

### 1.6.0 (2016-12-30)
* [ADD] yyl webpack-vue 模式下新增可支持 自定义 webpack.config
* [ADD] yyl config 新增 plugins 字段 用于设置额外需要安装的 npm package

### 1.5.1 (2016-12-26)
* [FIX] 修复 util.buildTress 函数目录树展示问题
* [EDIT] 调整 yyl init 生成的 目录结构
* [EDIT] yyl 执行时添加 版本检测


### 1.5.0 (2016-12-24)
* [ADD] 新增执行 yyl init 后, config 中会带有 当前 yyl version, 方便之后如果更新出现问题能回滚到特定版本
* [ADD] yyl update 支持更新到指定版本
* [ADD] rev 生成映射表时 如只更新 images 图片， 其他相关 html, css 也会一同更新 hash
* [ADD] 新增 yyl watch 图片更新立即生效

### 1.4.0 (2016-12-23)
* [ADD] yyl init 命令 新增 可选 初始化 no-components, multi-project 等初始化 类型


### 1.3.0 (2016-12-22)
* [ADD] 新增 webpack-vue mobile 可配置多个入口
* [FIX] 修复 browserify-babel example 中 no-components 用例运行不了问题

### 1.2.0 (2016-12-13)
* [ADD] 新增 vue-webpack 移动端工作流

### 1.1.0 (2016-12-08)
* [ADD] 新增 webpack-vue mobile 用 工作流
* [ADD] 新增 browserify-babel pc用 es6 工作流

### 1.0.0 (2016-12-07)
* [ADD] 诞生
