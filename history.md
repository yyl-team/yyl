# 版本信息
## 3.6.0(*)
* [ADD] `webpack` seed 新增 `react-ts`, `react-ts-ie8` 2 种类型

## 3.5.1(2019-06-27)
* [FIX] 修复 `yyl init` 在 `webpack` `typescript` 里没有自动生成 `package.json` 问题`
* [FIX] 修复 `yyl watch` 在 `webpack` 会提示 autoprefixer wanning 问题
* [EDIT] 内部统一使用 `yh.parseConfig()` 函数初始化 config

## 3.5.1-beta7(2019-05-31)
* [FIX] 修复 `yyl all --isCommit` 在 `vue2-ts` 下抽离css 部分会报错问题

## 3.5.1-beta6(2019-05-30)
* [FIX] 修复 `yyl all --isCommit` 在 `vue2` 下抽离css 部分会报错问题

## 3.5.1-beta5(2019-05-29)
* [FIX] 修复 `yyl server start` 路径不正问题

## 3.5.1-beta4(2019-05-29)
* [FIX] 修复 `webpack` 类 项目执行 `--isCommit` 操作时 样式中会包含 js 的问题
* [FIX] 修复 `yyl server start` 会报错问题

## 3.5.1-beta2(2019-05-21)
* [EDIT] webpack babel 调整
* [EDIT] `yyl watch --proxy` proxy server 不再单独新开窗口

## 3.5.1-beta1(2019-05-19)
* [EDIT] `yyl init` 后 若发现存在 package.json 文件，则会自动执行安装处理
* [EDIT] `yyl init` 后 若发现存在 package.json 文件，添加 npm 命令
* [EDIT] `yyl init` 调整 `platform=both` 的 模块分割
* [TODO] `yyl init` both 情况下 ci 文件需调整
* [TODO] yyl init both 对应的 jest， e2e test 需要更新
* [TODO] `extFn.parseConfig` 发现在  w-proxy, w-server 中有调用， 待替换 

## 3.5.0 (2019-05-17)
* [ADD] 新增 `webpack` seed, 内置 `webpack`, `typescript`, `vue2`, `vue2-typescript` 4 种类型
* [DEL] 去掉 `webpack-vue2` seed, 但会做向下兼容处理
* [EDIT] 优化 `yyl init` 逻辑
* [DEL] 去掉 `yyl init` 中的 svn 选项 以及相关逻辑

## 3.4.10 (2019-04-29)
* [EDIT] 调整 yml 文件， 让发布支持 通过 `process.env.mode` 区分发布分支
* [DEL] 去掉多余的文件

## 3.4.9 (2019-04-25)
* [FIX] 修复 `yyl watch --proxy` 后，触发 `watch` 时 rev 触发不了问题

## 3.4.8 (2019-03-17)
* [EDIT] 更新 `yyl-seed-webpack-vue2` 到 `0.5.15` 添加 icon 支持

## 3.4.7 (2019-03-13)
* [FIX] 修复 log.warn 不会展开的问题
* [UPD] 更新 `yyl-seed-webpack-vue2` 到 `0.5.14` 去掉 `webpack-vue2` 自带的 `yyl-flexlayout`

## 3.4.7-beta2 (2019-02-26)
* [EDIT] 解决遗留问题

## 3.4.7-beta1 (2019-02-25)
* [EDIT] 遗留问题 `yyl init` both 时未处理好， 待后续版本更新

## 3.4.6 (2019-02-21)
* [FIX] 修复 gitlab-ci 遇到构建报错依然显示 pass 问题
* [ADD] 新增 每次启动清理 `anyproxy` 缓存功能
* [ADD] 新增 `yyl server clean` 会清除 anyproxy 缓存 的功能

## 3.4.5 (2019-02-21)
* [FIX] 更新 `yyl-seed-webpack-vue2` 到 `0.5.6` 修复 webpack-vue 老项目引入 `babel-polyfill` 会报错问题

## 3.4.4 (2019-02-19)
* [FIX] 更新 `yyl-seed-webpack-vue2` 到 `0.5.5` 修复 webpack-vue `import` 和 `module.exports` 混用报错问题

## 3.4.3 (2019-01-03)
* [FIX] 更新 `yyl-seed-webpack-vue2` 到 `0.5.4`

## 3.4.1 (2019-01-03)
* [FIX] 修复 在 `docker` 环境下 构建工具报错问题

## 3.4.0 (2019-01-02)
* [ADD] 接入 `yyt` 测试
* [ADD] 新增 `yarn` 配置
* [EDIT] log 部分 ui 改造
* [EDIT] 升级 `yyl-util` 到 `2.0` 版本
* [EDIT] 改造 `extFn` `log` `vars` 部分代码

## 3.3.8 (2019-01-16)
* [FIX] 修复 `config.proxy.https` 配置无效问题
* [FIX] https 代理情况下 `livereload` 请求异常问题

## 3.3.7 (2019-01-03)
* [ADD] 更新 `yyl-seed-webpack-vue2` 到 `0.4.2` 修复 multi entry 时 html 内 js 包含所以 entry chunk 的问题

## 3.3.6 (2018-12-29)
* [ADD] 更新 `yyl-seed-gulp-requirejs` 到 `2.5.8` 将 初始化 入口 从 `demo.html` 改为 `index.html`
* [EDIT] yyl 默认配置文件为 `yyl.config.js`, 找不到才去获取 `config.js` 作为配置文件
* [EDIT] `yyl init` 初始化 生成的配置文件名字改为 `yyl.config.js`
* [FIX] 修复配置文件 只配置 `config.localserver`, `config.proxy` 时， `yyl server` 启动不了问题
* [FIX] 修复 `yyl watch` 没加 `--proxy` 仍然会启动 `proxy server` 的问题

## 3.3.5 (2018-12-26)
* [ADD] tpl 类型 文件 经过 any-proxy 默认允许跨域访问

## 3.3.4 (2018-12-25)
* [FIX] 修复 `yyl watch --name pc` 不会 把 `--name` 传到 proxy 那边 的问题
* [ADD] 升级 `yyl-seed-webpack-vue2` 到 `0.4.1` 支持 `config.px2rem` 配置项

## 3.3.3 (2018-12-17)
* [EDIT] `config.proxy.https` 新增项， 设置为 `true` 才进行 https 代理
* [EIDT] 更新 `yyl-seed-gulp-requirejs` 到 `2.5.7` 修复 `config.mainHost`， `config.staticHost` 后不带 `/` 会生成路径不对问题

## 3.3.2 (2018-11-27)
* [FIX] 修复在手机上不能 热更新问题

## 3.3.1 (2018-11-27)
* [FIX] 修复在 新的 `anyproxy` 模式下 `__webpack_hmr` 不能正常代理问题
* [EDIT] 初始化时将常用配置 属性 暴露到 `config.js` 下面

## 3.3.0 (2018-11-26)
* [ADD] yyl proxy 代理 接入 `any-proxy` 端口 `5001`

## 3.2.2 (2018-11-20)
* [FIX] ci 默认config 修改

## 3.2.1 (2018-11-19)
* [FIX] 更新 `yyl-seed-webpack-vue2` 到 `0.3.3` 来优化 `--remote` 样式不生效的问题

## 3.2.0 (2018-11-18)
* [ADD] 新增 `yyl proxy` 命令
* [ADD] seed `webpack-vue2` 支持 `hmr`
* [EDIT] 将 `log('start', xx)` 统一放到 `w-cmd.js` 里面
* [EDIT] `optimize` 包含 `localserver` 部分,  而 `proxy` 服务则独立新开窗口执行
* [EDIT] `yyl commit` 代码逻辑优化
* [EDIT] `yyl server` 代码逻辑优化

## 3.1.8 (2018-11-14)
* [EDIT] 更新 `yyl-seed-webpack-vue2` 到 `0.2.8` 用来处理 `svg` 格式文件

## 3.1.7 (2018-11-14)
* [FIX] 修复 使用 `config.concat` 在 命令行 `--proxy` 不会补全 hostname 的问题

## 3.1.6 (2018-11-12)
* [FIX] 更新 `yyl-seed-webpack-vue2` 到 `0.2.5` 修复 `--NODE_ENV` 不生效问题

## 3.1.5 (2018-11-12)
* [FIX] 更新 `yyl-seed-webpack-vue2` 到 `0.2.4` 提供 `--NODE_ENV` 属性支持

## 3.1.4 (2018-11-08)
* [FIX] 更新 `yyl-seed-webpack-vue2` 到 `0.2.3` 来修复 项目 不支持 `.webp` 格式 问题

## 3.1.3 (2018-11-07)
* [FIX] 修复 `yyl` 构建不能正确识别 `config.platform` 属性问题

## 3.1.2
* [FIX] 更新 `yyl-seed-gulp-requirejs` 到 `2.5.6` 来修复 `optimize.watch` 多次触发问题, 压缩出来的 js 不能在 ie8 下面运行问题
* [EDIT] 调整 `yyl commit` 界面
* [EDIT] 优化 `yyl server start` 功能

## 3.1.1
* [FIX] 更新 `yyl-seed-gulp-requirejs` 到 `2.5.2` 来修复 `optimize` 路径替换异常问题

## 3.1.0
* [FIX] 修复 `yyl init` 生成 没有 `.gitignore` 文件 问题

## 3.0.3
* [ADD]  新增 `config.proxy.homePage` 属性 用于定义 默认打开的页面
* [EDIT] 更新 `yyl-seed-webpack-vue2` 到 `0.1.7`

## 3.0.2
* [FIX] 修复 ci 执行 `yyl all` 报错后不会终止的问题
* [FIX] 修复 `webpack-vue2` 执行带有 `@yy/tofu-ui` 会构建失败问题
* [FIX] 修复 `yyl commit` 界面显示不正常问题

## 3.0.1
* [EDIT] 将 `initPlugin` 存放目录挪到 `~/.yyl/plugin`
* [FIX] 修复 `gulp-requirejs` 下 生成 `t-xx.tpl` uglify 时 某种情况会导致 js报错的问题
* [FIX] 修复 `{$xx-xx}` 不被识别问题


## 3.0.0
* [EDIT] 优化构建逻辑 构建项目不再需要二次安装
* [DEL] 去掉 `yyl examples`
* [DEL] 去掉 `yyl supercall`
* [DEL] 去掉 `yyl jade2pug`


## 2.26.0 (2018-09-18)
* [FIX] `webpack.publish.js`设置process.env.NODE_ENV=production
* [EDIT] 新增vue2项目 通用alias
* [EDIT] 新增vue2项目 vscode 支持文件 jsconfig.json

## 2.25.9 (2018-08-13)
* [FIX] `w-proxy` 有问题 先回档

## 2.25.8 (2018-08-13)
* [EDIT] 适配 `linux` 环境

## 2.25.7 (2018-08-13)
* [EDIT] 去掉没用的依赖 v2

## 2.25.6 (2018-08-10)
* [EDIT] 去掉没用的依赖

## 2.25.4 (2018-08-09)
* [EDIT] `config.plugins` 支持 `@yy/xxxx@version` 形式

## 2.25.3 (2018-08-08)
* [EDIT] `config.plugins` 支持 `@yy/xxxx` 形式

## 2.25.2 (2018-08-06)
* [FIX] 调整 `gulp-requirejs` `no-component` example
* [EDIT] `gulp-requirejs` 生成 `dest` 文件 地址保留 query 相关信息 如 `a.js?2018xxx`

## 2.25.1 (2018-08-01)
* [FIX] 修复 `webpack-vue2`, `webpack` 在 `watch --remote` 模式下构建 目录不正确问题

## 2.25.0 (2018-07-31)
* [EDIT] `yyl 新增 mock 功能`
* [EDIT] `webpack-vue2` `webpack` 中的 `async_component` hash 支持在 hash 映射表中显示

## 2.24.3 (2018-07-18)
* [FIX] 修复 `webpack-vue2` `webpack-vue2-for pc` 种子 不兼容 ie 10 问题

## 2.24.2 (2018-07-12)
* [FIX] 修复 `gulp-requirejs` watch 时 如 同目录下 同时存在 `a.js`, `a.js.bak` 时, 修改 `a.js` 不能正常触发 压缩逻辑的问题

## 2.24.1 (2018-07-06)
* [EDIT] 优化 `rev-build` 与 `rev-update` 衔接逻辑
* [FIX] 修复 `gulp-requirejs` tpl 文件内 路径不会替换对应的 hash 问题
* [FIX] 修复 `gulp-requirejs` 中 路径替换 相对路径会出现 替换错误的问题

## 2.24.0 (2018-07-03)
* [EDIT] 升级 yyl node 最低支持版本 为 `6.0.0`
* [ADD] 新增 `webpack-vue2`, `webpack` `process.env.NODE_ENV` 变量
* [EDIT] 优化 `webpack-vue2`, `webpack` 构建速度
* [EDIT] 优化 `yyl` throw error 逻辑

## 2.22.5 (2018-06-14)
* [ADD] 新增 `config.js` `disableHash` 配置项用于禁止项目生成 hash 文件

## 2.22.4 (2018-06-14)
* [FIX] 补充 `webpack` `webpack-vue2` 对 `.css` 文件的 解析支持

## 2.22.3 (2018-06-14)
* [FIX] 修复 yyl `gulp-requirejs` `watch` 检查 `pug` 文件 遇到 `include  ../w-giving\w-giving` 两个空格无法正常检测的问题

## 2.21.2 (2018-06-04)
* [FIX] 修复 yyl 运行时会出现 `express is not define` 错误的问题

## 2.21.1 (2018-06-03)
* [FIX] 修复 `gulp-requirejs` watch 时 如发生报错, 第二次执行时将不能正常完成 optimize 的问题

## 2.21.0 (2018-05-31)
* [ADD] `gulp-requirejs` 新增 `__url(path)` 语法糖 用于 js 中 获取 项目中静态资源地址
* [FIX] 修复 `gulp-requirejs` 打包出来的 项目会出现 本地目录路径问题

## 2.20.0 (2018-05-24)
* [DEL] 去掉 `webpack-vue` 工作流
* [ADD] `webpack`, `webpack-vue2` 支持 异步加载 模块 功能

## 2.19.1 (2018-05-18)
* [ADD] `gulp-requirejs` 添加 svga 路径替换 需要替换成 主域名的逻辑

## 2.19.0 (2018-05-15)
* [ADD] `webpack-vue2` 新增 `postcss-loader`
* [ADD] `webpack-vue2` 新增 `autoprefixer`
* [ADD] `webpack-vue2` 新增 `postcss-px2rem`
* [ADD] `webpack-vue2` 新增 `eslint` 代码检查
* [ADD] 新增 `svga` 支持
* [ADD] `webpack` 新增 `postcss-loader`
* [ADD] `webpack` 新增 `autoprefixer`
* [ADD] `webpack` 新增 `postcss-px2rem`
* [ADD] `webpack` 新增 `eslint` 代码检查
* [ADD] `webpack-vue2` 优化 `single-project` 例子, 新增带有 `vuex` 使用例子
* [ADD] `config.js` 新增 `config.platform` 参数, `postcss` 在 `config.platform = mobile` 时会加入 `postcss-px2rem` 插件
* [ADD] `config.js` 新增 `eslint` 参数 配置是否使用 eslint
* [EDIT] 简化 `yyl init` example 选择， 如果发现 example 只有 1个的时候 直接选择并跳过
* [EDIT] `webpack-vue2` 升级 `webpack` 到 4.0
* [FIX] 修复 `webpack` 构建 在 window 下 运行不了了问题
* [FIX] 修复 `webpack-vue2` 每次都要重新安装 `config.plugins` 里面的组件的问题
* [FIX] 修复 `yyl commit --config` 无效问题


## 2.18.0 (2018-04-15)
* [ADD] 新增 `webpack` 构建类型
* [DEL] 删除 `webpack-vue` 里面的 `no-components` 类型

## 2.17.6 (2018-04-12)
* [FIX] 修复 `webpack-vue2` 添加 `config.plugins` 参数会报错问题
* [DEL] 去掉 `yyl init` 中 选择 `git or svn` 选项， 全部默认 `git 配置方案`
* [ADD] `yyl watch, yyl commit` 时 的 `init config` 新增 `config` 内的 参数校验
* [EDIT] 补回 `webpack-vue` `webpack-vue2` 的 `{$config.alias[key]}` 语法糖

## 2.17.5 (2018-04-09)
* [ADD] 新增 `webpack-vue`, `webpack-vue2` 用 `eslintrc` `editorconfig` 配置文件
* [EDIT] `yyl init` `mobile` 下 默认选中 `webpack-vue2`
* [FIX] 修复 `webpack-vue` 解析不了 `*.vue` 文件问题

## 2.17.4 (2018-04-04)
* [EDIT] `gulp-requirejs` 中的 `inlinesource` 只会在 `iEnv.isCommit` 为 `true` 时有效
* [FIX] 修复 `gulp-requirejs` `watch` 命令后 tpl 代码不跟新问题
* [FIX] 修复 `gulp-requirejs` `watch` 时 `rutimefiles` 为 0 时 watch 不执行下去的 问题
* [FIX] 修复 `gulp-requirejs` `muti-project` 初始化运行不了问题
* [FIX] 修复 `gulp-requirejs` `no-components` 初始化运行不了问题

## 2.17.1 (2018-03-29)
* [ADD] `config.js`  新增 `config.commit.staticHost`, `config.commit.mainHost`
* [EDIT] `gulp-requirejs` 模板新增压缩功能

## 2.17.0 (2018-03-27)
* [ADD] `gulp-requirejs` 新增 `/*exclude: <moduleName>,<moduleName>*/` 语法糖用于 `requirejs` 打包时 对特定模块进行不打包处理
* [ADD] `gulp-requirejs` 新增 `css inline`
* [ADD] `gulp-requirejs` 新增 `t-xx` 类型模块 用于输出 tpl文件

## 2.16.1 (2018-01-26)
* [FIX] 修复 `yyl server clear` 不会结束问题
* [EDIT] 优化执行 `npm install ` 时看上去像没反应的问题

## 2.16.0 (2018-01-26)
* [ADD] `yyl` 新增 `--logLevel` 参数
* [ADD] `yyl` `config` 新增 `config.proxy.ignores` 参数
* [EDIT] 简化 构建工具 `optimize` 时界面
* [EDIT] 分离 `yyl watch` 中 `server` 与 `optimize` 到 两个独立的窗口
* [EDIT] `yyl` 构建方式改成内联，不再通过 `util.runCMD(gulp watch)` 的方式进行调用
* [DEL] 去掉 `yyl` 对 全局 `gulp` 的依赖
* [DEL] 去掉 `yyl debug`
* [DEL] 去掉 `yyl server rebuild` 方法

## 2.15.41 (2018-02-07)
* [ADD] 新增 `yyl optimize` 时 对项目版本要求的检查

## 2.15.40 (2018-02-07)
* [FIX] 修复 `config.resource` 为 null 时 构建报错问题

## 2.15.39 (2018-02-01)
* [FIX] `server error` bugfix

## 2.15.38 (2018-01-31)
* [ADD] 支持 `svga` 类型 图片

## 2.15.37 (2018-01-31)
* [ADD] 新增  `yyl --config [path]` 配置项

## 2.15.36 (2018-01-30)
* [FIX] 修复 `gulp-requirejs` 绝对地址匹配不正常问题

## 2.15.35 (2018-01-29)
* [FIX] `gulp-requirejs` `p-xx` 也同样需要监听 被其他 `p-xx` 调用的情况
## 2.15.34 (2018-01-29)
* [FIX] `gulp-requirejs` `p-xx` 也同样需要监听 被其他 `p-xx` 调用的情况

## 2.15.33 (2018-01-24)
* [ADD] 新增 `yyl all` 自测用例
* [FIX] 修复 `gulp-requirejs` 在`pug` 文件存在 `<style>` `style=""` 并带有图片时显示不正常问题
* [FIX] 修复 `webpack-vue` 在 mac os 上执行出错问题

## 2.15.32 (2018-01-18)
* [FIX] 修复 `gulp-requirejs` 运行 `supercall` 时 在 部分电脑内报错问题(`win10`?)

## 2.15.31 (2018-01-17)
* [FIX] 修复 `webpack-vue` 中 watch 重复执行问题
* [FIX] 修复 `yyl concat` css 文件 加 分号导致样式问题

## 2.15.30 (2018-01-17)
* [FIX] 修复 `yyl update` 执行失败问题

## 2.15.29 (2018-01-17)
* [ADD] 新增 `proxy` 日志， 当 `--logLevel > 1` 时会显示
* [ADD] 新增 `yyl server rebuild <projectName>`
* [FIX] 修复 `yyl init` 不能正常拷贝文件 问题

## 2.15.28 (2017-12-28)
* [ADD] `yyl init` 新增 `--name`, `--platform`, `--workflow`, `--init`, `--doc` 参数
* [ADD] 新增 `yyl update <package> <version>` 一键 update yyl 内所有 `package.json`, `package-lock.json` 中 组件版本 命令
* [ADD] 引入 `test` 模块
* [ADD] `yyl supercall rev-build` 新增 对 `html` 文件 路径 format 功能 (包括 相对路径 变绝对路径， 路径 `../`, `./` format)
* [ADD] `webpack-vue` `config.js` 新增 `resource` `concat` 属性配置项
* [ADD] `yyl server start` 新增 `--proxy` 参数， 可以同时启动 server 和 proxy
* [ADD] 新增 `yyl info` 用来显示当前项目 构建信息
* [ADD] html 生成 现 支持 `{$alias}` 语法糖，生成后会自动替换成 `config.alias` 内对应的地址并 处理好相对位置
* [EDIT] `webpack-vue` rev 构建模式 改用全局的 `supercall rev-build`, `supercall rev-update` 方法
* [DEL] 去除 `yyl init` 中 `platfrom` 可以多选 `pc` 和 `mobile`， 改为 `单选`
* [FIX] 捕抓 `proxy` 中 出现的 `connect ECONNREFUSED` 错误, 不让这错误打印到 log 中
* [FIX] 修复 `webpack-vue2` 运行报错问题
* TODO 新增 `__inline(path)` `__url(path)` js 语法糖 用于js 中 直接引入 模板文件内容 和 url 地址

## 2.15.27 (2017-12-14)
* [EDIT]`config.js` 中 在 `config.onBeforeCommit` 和 `config.svn[branches].onBeforeCommit` 两个地方都可配置 提交前的操作, 其中优先级是后者比前者优先级要高

## 2.15.26 (2017-12-12)
* [EDIT] 升级 `gulp-requirejs` 中 `jade` 为 `pug`, 升级后不再对 `*.jade` 文件进行渲染，只对 `*.pug` 文件渲染
* [ADD] 新增 `yyl jade2pug` 命令 一键把原有项目中的 `*.jade` 格式转成 `*.pug` 格式

## 2.15.24 (2017-12-11)
* [EDIT] 锁定 `gulp-requirejs`, `gulp-rollup`, `webpack-vue`, `webpack-vue2` 中 `package.json` 依赖组件的版本
* [ADD] `gulp-requirejs`, `gulp-rollup` 新增 `--remote` 选项
* [ADD] 新增 `yyl make` 功能
* [EDIT] `yyl update` 功能完成
* [ADD] `gulp-requirejs`, `gulp-rollup` 支持在 `p-xx.jade` 里面直接引用 `p-xx.scss` 构建工具会自动转义成 `xx.css`
* [FIX] 修复 `gulp-rollup` 在 `watch` `p-xx-xx` 时 修改 `jade` 不会触发更新问题

## 2.15.23 (2017-12-01)
* [FIX] 修复 `gulp-requirejs`, `gulp-rollup` 运行 会报错问题 

## 2.15.22 (2017-11-30)
* [FIX] 修复 `gulp-requirejs`, `gulp-rollup` `jade` 中 `<script type="type/html"></script>` 路径不会替换的问题

## 2.15.21 (2017-11-22)
* [EDIT] 优化 `yyl supercall rev-build`,  `yyl supercall rev-update` 信息展现
* [FIX] 同步更新 `gulp-rollup` `yyl watch` 时 如果 `w-xx` 组件 引用 `w-xx2` 组件时， 修改 `w-xx2` 组件 不会进行相应的更新 的问题

## 2.15.20 (2017-11-21)
* [EDIT] 调整`yyl-util` `vars` 变量到 yyl 主干下， 不再放置于 `yyl-util` 组件内
* [EDIT] 调整`yyl-util` `livereload()`, `initConfig()` 变量到 yyl 主干下， 不再放置于 `yyl-util` 组件内
* [FIX] 修复 `gulp-requirejs` `yyl watch` 时 如果 `w-xx` 组件 引用 `w-xx2` 组件时， 修改 `w-xx2` 组件 不会进行相应的更新 的问题

## 2.15.17 (2017-11-20)
* [EDIT] `gulp-rollup` 工作流 `yyl watch` 优化，能自动检测需要构建的文件, 不再是 整个 task 的去运行

## 2.15.16 (2017-11-17)
* [EDIT] `gulp-requirejs` 工作流 `yyl watch` 优化，能自动检测需要构建的文件, 不再是 整个 task 的去运行

## 2.15.15-beta1 (2017-11-14)
* [FIX] 修复 `svn commit` 在高版本 svn `1.9.7` 提交经常出错问题

## 2.15.15 (2017-11-14)
* [FIX] 修复 `gulp-requirejs`, `gulp-rollup` 打包不会压缩 js 的问题

## 2.15.14 (2017-11-11)
* [EDIT] 将 `gulp-requirejs`, `gulp-rollup` 中  `rev` 相关任务提取到 `yyl supercall rev-update`, `yyl supercall rev-build` 作为通用方法
* [EDIT] 优化 `yyl commit` svn 提交逻辑， 执行 `svn update` 之前不会进行目录清空操作
* [FIX] 修复 `gulp-requirejs`, `gulp-rollup` 中只修改图片 样式 hash 不更新问题

## 2.15.13 (2017-11-10)
* [ADD] 新增 `yyl commit` 时 `--nooptimize` 参数

## 2.15.12 (2017-11-10)
* [EDIT] 优化 `gulp-requirejs`, `gulp-rollup` 中 log 显示
* [FIX] 修复 `gulp-requirejs`, `gulp-rollup` 执行 `yyl watch --proxy` 后 `js` 部分修改后无法正常更新问题

## 2.15.10 (2017-11-08)
* [FIX] `gulp-requirejs`, `gulp-rollup` 中 `html-dest` 图片地址替换问题修复(陈年老bug)

## 2.15.9 (2017-11-07)
* [EDIT] `gulp-requirejs` 中 `yyl watch` 不再在 `src` 目录下生成文件
* [EDIT] 重构 `gulp-requirejs`, `gulp-rollup` 中 stream 流部分代码

## 2.15.8 (2017-11-03)
* [FIX] 修复 `yyl commit` 会吧 `x.json` 文件一起压缩问题

## 2.15.7 (2017-11-02)
* [FIX] 修复 `yyl wath --proxy` js 修改后文件不更新问题

## 2.15.6 (2017-11-02)
* [EDIT] 优化 `yyl wath` log 展示

## 2.15.5 (2017-11-02)
* [FIX] 修复 调整 `config.revRoot` 会导致 目录生成错误问题

## 2.15.4 (2017-11-01)
* [FIX] 修复 `yyl watch --rev remote` 不会获取映射文件问题

## 2.15.3 (2017-11-01)
* [FIX] 修复 `yyl commit` 不会对文件进行压缩 问题

## 2.15.2 (2017-10-31)
* [FIX] 修复 `onInitConfig` 不生效问题

## 2.15.0 (2017-10-30)
* [ADD] `config.js` 新增  `onInitConfig` 属性

## 2.14.6 (2017-10-25)
* [FIX] 修复 `yyl watch` 时运行 buffer 超过 200k 时会出现 maxbuffer 的问题, 改用 `spawn` 运行

## 2.14.5 (2017-10-24)
* [FIX] 修复 `gulp-requirejs` 工作流中 watch 操作一次文件变更会触发几次 livereload 的问题

## 2.14.3 (2017-09-16)
* [ADD] 工作流 新增 对 `webp` 格式图片 支持

## 2.14.3 (2017-09-14)
* [EDIT] `yyl-util` 版本更新以修复 `yyl watch --proxy` 时不能跳到正确地址问题

## 2.14.2 (2017-09-13)
* [ADD] 新增 `yyl update` 自动更新

## 2.14.0 (2017-09-13)
* [EDIT] `yyl watch --proxy` 时默认打开的 html 如 遇到 default.html index.html 时 优先打开
* [EDIT] 完善各项目构建时的 `README.md` 文档
* [EDIT] 将 `yyl watch` 执行后的处理整合到同一个文件里面

## 2.13.7 (2017-07-21)
* [FIX] 修复 `webpack-vue`, `webpack-vue2` 工作流 执行 `--ver remote --sub trunk` 时不能生成远程映射回来的文件问题
* [FIX] 修复 `webpack-vue`, `webpack-vue2` 在 node 4.x 下运行报错问题

## 2.13.5 (2017-07-13)
* [FIX] 改善 `gulp-requirejs` 工作流 `run-sequence` 执行过多问题

## 2.13.3 (2017-07-05)
* [FIX] 暂时屏蔽在 html 文件中加 proxy 提示的功能， 等完善后再上

## 2.13.2 (2017-07-05)
* [FIX] 修复 执行 `--proxy` 时 在 ie 浏览器下 由于没有设置 content-type 导致样式识别不了问题

## 2.13.1 (2017-07-05)
* [FIX] 更新 `yyl-util` 到 `1.3.7` 以解决 执行 `util.runCMD` 方法时到一定情度的时候会触发 `maxBuffer error`

## 2.13.0 (2017-07-03)
* [ADD] 工作流 如果设置了 `config.proxy.localRemote` 并指向本地域名(`127.0.0.1:port`), 在运行工作流时设置 `--proxy `, 会优先打开该域名底下的当前文件
* [ADD] 工作流 使用本地代理 访问外网站点是右下角会出现 `yyl proxy` 文字提醒

## 2.12.0 (2017-06-30)
* [ADD] 工作流 `webpack-vue`, `webpack-vue2` 的 `config.js` 中 新增 `entry`, 对应 webpack.config.js 中的 entry 字段
* [ADD] 代理组件 中 新增 映射 log, 方便排查
* [DEL] 删除 `webpack-vue` example 中的 `es6`, `with-global-component` 例子

## 2.11.0 (2017-06-26)
* [ADD] 工作流 `gulp-requirejs`, `rollup` 的 `config.js` 中 新增 `resource` 属性用于自定义开发项目中需要一并打包同步到dist的文件夹
* [EDIT] 工作流 `README.md` 中 新增 对 打包命令的 例子说明

## 2.10.1 (2017-06-22)
* [FIX] 修复在config.commit.hostname 中填写 不带协议的 url如 `//www.yy.com` 时，路径替换出错问题

## 2.10.0 (2017-06-19)
* [DEL] 去掉不完善的 `browserify-babel` 工作流
* [EDIT] 调整 工作流中 `config.js` 的默认设置
* [EDIT] 工作流跑起时新增组件 version 对比
* [EDIT] 优化工作流 watch 队列执行机制

## 2.9.0 (2017-06-07)
* [ADD] 本地服务器内文件 支持 post 请求获取

## 2.8.5 (2017-06-07)
* [ADD] 如果 proxy 访问域名 映射回本地服务器， 则在 header 添加 cache-control: no-cache 禁掉缓存

## 2.8.4 (2017-06-06)
* [FIX] 修复 proxy 环境下 post 请求一直 padding 问题
* [EDIT] 完善 `gulp-requirejs`, `browserify-babel`, `rollup`, `webpack-vue`, `webpack-vue2` 中对本地代理部分的说明

## 2.8.3 (2017-06-06)
* [EDIT] yyl watch 如果有 index.html, default.html 会优先打开
* [EDIT] 优化 `gulp-requirejs` 冒泡提示功能
* [FIX] 修复 `gulp-requirejs`, `browserify-babel`, `rollup` 中 rev 过滤 md5 文件时会过滤掉一些正常文件的问题
* [FIX] 修复 通过 proxy 代理访问其他页面容易出现 `socket hang up`, `connect ECONNREFUSED` 错误问题

## 2.8.2 (2017-06-05)
* [FIX] 修复 `gulp-requirejs`, `browserify-babel`, `rollup` 中 压缩js 不会匹配 p-xx-xx.js 问题

## 2.8.1 (2017-06-02)
* [FIX] 修复 `webpack-vue`, `webpack-vue2` 在执行 `yyl watch --ver remote` 时报错问题

## 2.8.0 (2017-06-01)
* [ADD] `gulp-requirejs`, `rollup`, `browserify-babel` 模式下 测试数据(模拟接口返回)统一存放在 `js/data/` 目录下的 json 文件, 工程将会 同步到 `config.jsDest` 设置的目录下面

## 2.7.4 (2017-05-31)
* [FIX] bugfix

## 2.7.4 (2017-05-31)
* [FIX] bugfix

## 2.7.3 (2017-05-31)
* [FIX] 修复 yyl watch 时如 localserver.root 不存在时会出现本地服务器创建目录不对问题

## 2.7.2 (2017-05-31)
* [FIX] 修复 当 jade 文件中 存在 p-xx-xx 写法时， 图片路径替换不生效问题
* [EDIT] 更新 gulp-requirejs, browserify-babel, rollup 中 jade 文件 引入图片的方法说明
* [EDIT] 更新 yyl init 时 各 工程中 对 proxy 中的初始化设置

## 2.7.1 (2017-05-26)
* [EDIT] rollup 工作流支持 js 内部this 和 module.exports 方式

## 2.7.0 (2017-05-26)
* [ADD] 新增 yyl watch 等打包操作时 新增 --silent 参数，用于配置 是否隐藏冒泡提示

## 2.6.2 (2017-05-25)
* [EDIT] proxy server 增加在设置 localRemote 将 域名指向本地服务器时， 127.0.0.1 localserver 中找不到资源，会透传到线上 逻辑

## 2.6.1 (2017-05-25)
* [EDIT] 调整 proxy 部分 log

## 2.6.0 (2017-05-24)
* [ADD] 新增本地代理功能(告别 fillder)
* [DEL] 去掉 yyl init 初始化时询问是否查找 common 目录的功能

## 2.5.0 (2017-05-20)
* [EDIT] 完善 rollup 工作流

## 2.4.2 (2017-05-19)
* [EDIT] 完善 readme 文档
* [EDIT] 完善 config.js 说明

## 2.4.1 (2017-05-18)
* [FIX] 修复在 node 4.x 运行 webpack-vue2 出现组件欠缺问题
* [FIX] 修复 执行 yyl server clear 后, config.plugins npm install 路径不对问题
* [EDIT] 初始化增加 扫描 package.json 里面的 dependencies 属性 来进行 npm install
* [EDIT] 优化 yyl server clear 命令

## 2.4.0 (2017-04-11)
* [ADD] 新增 rollup 工作流
* [WARN] 发现 browserify 工作流中 模板 必须 使用 module.export = xx 方式结尾， 不能使用 export default 方式， 待修复
* [EDIT] 完善 svnConfig.onBeforeCommit 功能

## 2.3.5 (2017-04-07)
* [FIX] 去掉多余的代码

## 2.3.4 (2017-04-07)
* [FIX] 修复 vue 文件 es6 语法不编译问题

## 2.3.3 (2017-04-05)
* [FIX] 修复 yyl watch --ver remote 时 再次更新 rev-manifest.json 文件显示不正常问题

## 2.3.2 (2017-04-05)
* [FIX] rev-update 时 报错问题

## 2.3.1 (2017-04-05)
* [EDIT] 将 vue-loader sass 模块 也当做 scss 模块进行编译

## 2.3.0 (2017-04-05)
* [EDIT] 将 webpack-vue2 改用为 webpack2

## 2.2.1 (2017-03-28)
* [FIX] 修复 webpack-vue, webpack-vue2 组件clean 报错问题
* [EDIT] 更新 每个 example 里面 对 flexlayout 组件引用 的版本
* [ADD] yyl commit 时会自动清除 dest 文件夹内容

## 2.2.0 (2017-03-28)
* [ADD] 新增 各工作流 optimize, watch task 时会出现 notify 提示

## 2.1.1 (2017-03-27)
* [ADD] webpack-vue2 example bug fix

## 2.1.0 (2017-03-27)
* [ADD] 新增 webpack-vue2 yyl 初始化工程

## 2.0.5 (2017-03-27)
* [FIX] 修复 yyl 初始化时 由于 yyl 全局安装是处在 node_modules 文件夹下， 而拷贝文件时又设置了 跳过 node_modules 文件夹的操作， 导致拷贝失败问题

## 2.0.4 (2017-03-27)
* [FIX] 修复 yyl 初始化组件时 只生成 dist 空文件问题

## 2.0.3 (2017-03-27)
* [ADD] 新增组件 调试命令 yyl debug

## 2.0.2 (2017-03-27)
* [FIX] 修改 bin/init.js 文件格式为 unix (修复mac 系统下安装完会出错问题)

## 2.0.1 (2017-03-09)
* [EDIT] 修改 package.json 组件依赖

## 2.0.0 (2017-03-09)
* [EDIT] yyl 命令安装改为通过 npm install yyl 方式全局安装
* [DEL]  去除 yyl update 方法

## 1.12.1 (2017-02-23)
* [FIX]  去掉安装/ 卸载时对 yyl-util 的依赖

## 1.12.0 (2017-01-11)
* [EDIT] 将 yyl-util, yyl-color 提取到 npm 上面

## 1.12.0 (2017-01-11)
* [EDIT] 将 yyl-util, yyl-color 提取到 npm 上面

## 1.11.2 (2017-01-09)
* [ADD] vue-webpack 支持 多个entry 中 单独渲染 自己的 css 文件
* [FIX] 修复 vuewebpack 里面 jade 模板渲染不了问题
* [FIX] 修复 vuewebpack 里面 css 文件名称 不跟 entry 定义问题
* [FIX] 修复 vue-webpack demo 中 no-component 里面 head标签 缺少闭合问题

## 1.11.0 (2017-01-06)
* [ADD] yyl rm 句柄，方便卸载 node_modules 文件
* [ADD] 新增 软件卸载用 uninstall.bat, uninstall.sh 文件
* [EDIT] 将组件 安装, 卸载 改用 命令行代替

## 1.10.0 (2017-01-05)
* [FIX] 修复程序在 node 5+ 上面 运行缺失部分 nodecomponents 的问题
* [ADD] webpack-vue 下 html 文件 新增 可直接 用 img 标签引用 图片
* [ADD] 新增 yyl example 命令

## 1.9.0 (2017-01-05)
* [ADD] vue-webpack 类工作流 新增 no-components 模式

## 1.8.0 (2017-01-03)
* [ADD] yyl config 下 如设置 config.commit.revAddr 为空 or false, 则不会生成 md5相关文件

## 1.7.0 (2016-12-30)
* [ADD] yyl webpack-vue 下 js 目录下也支持 打包输出

## 1.6.0 (2016-12-30)
* [ADD] yyl webpack-vue 模式下新增可支持 自定义 webpack.config
* [ADD] yyl config 新增 plugins 字段 用于设置额外需要安装的 npm package

## 1.5.1 (2016-12-26)
* [FIX] 修复 util.buildTress 函数目录树展示问题
* [EDIT] 调整 yyl init 生成的 目录结构
* [EDIT] yyl 执行时添加 版本检测


## 1.5.0 (2016-12-24)
* [ADD] 新增执行 yyl init 后, config 中会带有 当前 yyl version, 方便之后如果更新出现问题能回滚到特定版本
* [ADD] yyl update 支持更新到指定版本
* [ADD] rev 生成映射表时 如只更新 images 图片， 其他相关 html, css 也会一同更新 hash
* [ADD] 新增 yyl watch 图片更新立即生效

## 1.4.0 (2016-12-23)
* [ADD] yyl init 命令 新增 可选 初始化 no-components, multi-project 等初始化 类型


## 1.3.0 (2016-12-22)
* [ADD] 新增 webpack-vue mobile 可配置多个入口
* [FIX] 修复 browserify-babel example 中 no-components 用例运行不了问题

## 1.2.0 (2016-12-13)
* [ADD] 新增 vue-webpack 移动端工作流

## 1.1.0 (2016-12-08)
* [ADD] 新增 webpack-vue mobile 用 工作流
* [ADD] 新增 browserify-babel pc用 es6 工作流

## 1.0.0 (2016-12-07)
* [ADD] 诞生
