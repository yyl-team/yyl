yyl 3.0
===================
致力为团队提供`开箱即用` 同时又允许 `高度自定义`的 前端构建方案

特点介绍
------------------
为项目开发提供方便又实用的功能

### 开箱即用
* 通过 `yyl init` 命令初始化 `gulp-requirejs`， `webpack` 两种类型项目, 自动初始化项目配置文件
* 通过 `yyl watch` 命令开发项目，自动 `构建并监听项目`、`本地server 启动`、 `本地代理启动` 
* 通过 `yyl all --isCommit` 命令完成项目打包

### 提供多种技术栈 seed 包
* `requirejs`
* `vue2-ts`
* `react-ts`

### 高效的本地开发模式
* 基于 `anyproxy` 代理框架 实现 `本地 server` 映射线上域名, 本地调试线上接口无压力

### 快速排查线上故障
* 基于 `hash rev-manifest` 的开发模式, 通过拉取线上 hash map 实现 `统一本地-线上资源hash`, 从而实现本地环境调试线上代码，免去以往需要借助 `fiddler` 代理工具对文件一一映射的繁琐操作

### 高扩展性
* 支持本地基于 `package.json` 的 npm 包安装
* 支持本地 `webpack.config.js` 文件

### 集成 CI
* 提供对应的 `docker-yyl` 用于 yyl 项目的 构建、发布

协作
------------------
* 若有任何问题, 欢迎提 [issuses](https://github.com/jackness1208/yyl/issues)
* 若想贡献代码, 欢迎 提一个 [pr](https://github.com/jackness1208/yyl/pulls)
