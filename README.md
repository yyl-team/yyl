# yylive work flow 说明文档
## 环境说明
项目基于 `node, gulp, svn, git` 搭建, 需要在 `node >= 4.0.0` 环境下运行
* 需要 node  `>= 4.0.0`
* 需要 全局安装 gulp `npm install gulp -g`
* 需要 svn `命令行安装` (在 cmd/终端 操作 输入 `svn` 有东西)
* 需要 git `命令行安装` (在 cmd/终端 操作 输入 `git` 有东西)
* mac 用户 svn 提交需要注意 cmd svn 版本 和 软件 svn 版本是否一致

## 安装
```
npm install gulp -g
npm install yyl -g
```

## 命令说明


### 整体说明
```
Usage: yyl <command>

Commands:
    init     项目初始化
    watch    执行打包并建立本地服务器监听
    all      执行打包操作
    server   yyl本地服务相关命令
    commit   提交代码到 svn/git
    update   更新
    make     创建模块
    jade2pug 批量把jade 文件转成 pug 


Options:
    -h, --help    帮助信息
    -v, --version 版本信息
    -p, --path    本程序目录
```

### 项目初始化相关命令
```shell
Usage: yyl init

Commands:

Options:
    -h, --help    帮助信息
    -f,           不管当前目录下有没文件，直接覆盖
```

### 压缩相关命令
```
Usage: yyl <command>

Commands:
    watch     打包并建立本地服务器监听文件
    watchAll  打包并建立本地服务器监听文件
    all       打包文件

Options:
    --name <name>    用于存在个多项目的工程，
                     name: 与config 里面的 配置保持一致

    --ver <remote>   线上rev-manifest 版本
                     remote: 版本信息 如直接拉取最新版 输入 'remote'

    --remote         同 --ver remote

    --proxy          开启本地代理服务(需要配置 config.proxy 参数)
```

### 提交相关命令
```
Usage: yyl commit <command>

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
Usage: yyl server <command>

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
Usage: yyl example <command>

```

### 删除文件相关命令
可以帮助快速删掉 node_modules 文件夹 `yyl rm node_modules`
```
Usage: yyl rm <dirname>

```

### 更新控件
version 选填，不填则默认最新
```
Usage: yyl update <version>

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

### rollup
rollup + es6 技术架构, 适用于 PC 端开发

#### 说明文档
* [说明文档](./init-files/rollup/README.md)

#### 例子
* [hello world](./examples/rollup/single-project)
* [一个项目集成多个子工程例子](./examples/rollup/multi-project)

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

### webpack-vue2
适用于 移动端开发

#### 说明文档
* [说明文档](./init-files/webpack-vue2/README.md)

#### 例子
* [hello world](./examples/webpack-vue2/single-project)


