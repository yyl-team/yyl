# 版本信息

## 5.0.6 (*)
* TODO: yyl seed install 添加选项选择对应的 seed 包进行更新
* TODO: 如遇到 zepto 禁止构建并提示更换
* TODO: yyl 执行时 会提示有新版本进行更新
* TODO: yyl 新增 ca 证书 清理操作 或者显示证书目录
* 通过 webpack.config.js 添加 vconsole 无效

## 4.0.5 (2021-06-10)
* feat: 更新 `yyl-seed-webpack@3.0.22`
* fix: 修复 px2rem 在 isCommit 情况下 处理异常问题
## 4.0.4 (2021-06-09)
* feat: 更新 `yyl-hander@1.3.20`
* fix: 兼容 `webpack-vue2` workflow
## 4.0.3 (2021-06-07)
* feat: 更新 `yyl-seed-webpack` 到 `3.0.21`
* feat: 优化 webpack watchOption
* fix: 修复 项目 自定义 `webpack.config.js` 当没有配置 `wConifg.output` 时会报错问题
## 4.0.2 (2021-06-03)
* feat: 更新 `yyl-seed-webpack` 到 `3.0.19`
* fix: 修复 `webpack` 类项目 `px2rem` 失效问题

## 4.0.1 (2021-05-28)
* feat: 更新 `yyl-seed-webpack` 到 `3.0.16`
## 4.0.0 (2021-05-28)
* feat: 新增 `yyl seed` 相关命令
* feat: 将 `yyl-seed-webpack`, `yyl-seed-gulp-requirejs`, `yyl-seed-other` 不包含到主体应用里面
* del: 去掉 `yyl info` 相关命令
* del: 去掉 `yyl rm` 相关命令
* del: 去掉 `yyl server` 相关命令
## 3.13.7 (2021-03-29)
* feat: 更新 `yyl-server@0.3.23` 修复 proxy 模式下 --port 不会修改 proxy.remote 下 `127.0.0.1:5000` 部分
* feat: 更新  `yyl-seed-webpack@2.6.5` 修复 window 模式下 remote 模式资源代理不能问题

## 3.13.5 (2020-12-28)
* feat: 更新 `yyl-os@0.11.4` 修复 macOs 打开 带 & 的 url 时结果不符合预期的问题
* feat: 更新  `yyl-seed-webpack@2.6.3` 调整配置中 alias 字段
## 3.13.4 (2020-12-21)
* feat: 更新 `yyl-server@0.3.22` 修复 proxy 模式下 目標地址白屏問題
## 3.13.3 (2020-12-14)
* feat: 更新 `yyl-server@0.3.21` 修复 proxy 模式下 本地服务中图片不能正确显示的问题
## 3.13.2 (2020-12-13)
* feat: 更新 `yyl-seed-webpack@2.6.2` 优化 rev 组件 log显示
* feat: 更新 `yyl-server@0.3.20` 支持 proxy 模式下 转发 headers 和 cookies
## 3.13.1 (2020-11-16)
* feat: 新增 `config.urlLoaderMatch` 属性, 用于配置 其他 需要用到 url-loader 的文件 
* feat: 更新 `yyl-server@0.3.19`
* feat: 优化本地服务启动错误 log 显示
* feat: 去掉 `yyl-seed-webpack` 类项目在打包时会生成 sourcemap 的操作
* feat: 更新 `yyl-seed-webpack@2.6.0`
* fix: 修复部分docker `Cannot find module 'core-js/modules/es6.regexp.to-string'` 问题

## 3.13.0(2020-10-13)
* feat: 新增 `config.watch.beforeScripts`, `config.watch.afterScripts`
* feat: 新增 `config.all.beforeScripts`, `config.all.afterScripts`
* feat: 最低支持改为 node 10 版本
* feat: 更新 `init-me@0.4.10` 优化 npm 配置错误 文案
* feat: 更新 `yyl-hander@0.12.2` 新增 beforeScript, afterScript 相关处理
* feat: 更新 `yyl-seed-gulp-requirejs@4.7.4` 统一 yyl.config types
* feat: 更新 `yyl-seed-other@0.1.3` 统一 yyl.config types
* feat: 更新 `yyl-seed-webpack@2.5.15` 统一 yyl.config types
* feat: 更新 `yyl-server@0.3.18` 统一 yyl.config types


## 3.12.1(2020-09-28)
* feat: 更新 `yyl-seed-webpack@2.5.14`
* feat: 兼容 webpack.devServer.historyApiFallback.rewrite 配置项
* fix: 修复 启动 `webpack.devServer` 时，如项目未安装 webpack 会报错的问题


## 3.12.0 (2020-09-27)
* feat: 更新 `yyl-seed-webpack@2.5.13` 兼容 当 `yconfig.localserver.entry` 时 `writeDisk` 自动设为 true
* feat: 更新 `yyl-server@0.3.17` 兼容 `seed-other` 出现的问题
* feat: 更新 `yyl-hander@0.11.4` 允许 `yyl.config.js` 只设置 `localserver` `proxy` 和 只设置 `proxy` 情况
* feat: 允许 `yyl server start --port false` 禁用本地server
* feat: 新增 `yyl-seed-other@0.1.1`
* feat: 兼容 `fec`, `feb`, `yys` 构建方案
* feat: 新增 `yyl-seed-gulp-other@0.1.1`
* feat: 更新 `yyl-seed-gulp-requirejs@4.7.3`
* feat: 当配置 `config.yarn: true` 时， 会自动删除 项目根目录中的 `package-lock.json` 文件
* fix: 修复 `yyl-seed-gulp-requirejs` 项目中 html 文件 `__url(path/to/file)` 语法糖失效问题
* fix: 修复 当 `config.commit.hostname === '//www.testhost.com/pc'` 这种带有 `pathname` 的 配置时， `localserver` 映射不正确问题

## 3.11.7 (2020-07-22)
* feat: 更新 `yyl-seed-gulp-requirejs@4.7.1`
* feat: 更新 `yyl-seed-webpack@2.5.9`
* feat: 更换 seed 包中 `node-sass` -> `sass`

## 3.11.6 (2020-07-22)
* feat: 更新 `yyl-seed-gulp-requirejs@4.7.0`
* feat: 更新 `yyl-seed-webpack@2.5.8`
* feat: 兼容 node@14

## 3.11.5 (2020-07-08)
* feat: 更新 `yyl-server@0.3.10` 修复 ios 13 不能正常代理https 问题
* feat: 更新 `yyl-os@0.11.2` 修复打开带[&] url 会报错问题

## 3.11.4 (2020-05-14)
* feat: 升级 `yyl-seed-webpack@2.5.7`
* fix: 修复 当 js 有 sugar 需要替换，而正好 html 引入了这个 js时，会出现 hash 不对的情况

## 3.11.3 (2020-04-27)
* feat: 升级 `yyl-seed-webpack@2.5.6`
* feat: 运行 webpack-dev-server 不再需要项目内安装 `webpack`, `webpack-dev-server` 了

## 3.11.2 (2020-04-23)
* feat: 升级 `yyl-seed-webpack@2.5.5`
* feat: 优化 `webpack-dev-server` 端口被占用时文案
* fix: 修复 js 不会使用 babel-loader 问题

## 3.11.1 (2020-04-21)
* feat: 升级 `yyl-seed-webpack@2.5.2`
* fix: 修复 默认端口 `5000` 不能用问题
* fix: 修复配置 `--port 4000` 时 hmr 依然指向 5000 的问题

## 3.11.0 (2020-04-21)
* feat: 升级 `yyl-os@0.11.0`
* feat: 升级 `yyl-hander@0.10.0`
* feat: 升级 `yyl-seed-webpack@2.5.0`
* feat: 升级 `yyl-server@0.3.8`
* feat: yyl 支持 `yarn` 配置项
* feat: 新增 `config.babelLoaderIncludes` 配置项
* fix: 允许通过 `--port` 自定义 本地server 端口的功能
* fix: 允许通过 `--proxy false` 自定义 是否打开 反向代理功能
* fix: 修复快捷命令 `yyl r`, `yyl o`, `yyl d` 里面的参数 会覆盖 后面输入的 命令问题

## 3.10.2 (2020-04-01)
* feat: 升级 `yyl-seed-webpack@2.3.1`
* fix: 修复 `webpack` 项目启动 webpack-dev-server 时会出现接口占用误判断问题

## 3.10.1 (2020-03-31)
* feat: 升级 `yyl-seed-webpack@2.3.0`
* feat: 升级 `init-me@0.4.7`
* feat: `seed-webpack` - pop 模块改为输入 `--tips` 后才出现
* feat: `seed-webpack` - 新增 `--writeToDisk` 参数, 用于控制 构建是否写入硬盘
* feat: `seed-webpack` - `style-loader` 现会自动配置 `data-module` 为 `yConfig.name` || `inline-style`
* fix:  `seed-webpack` - 修复插入 pop 模块后，主程序 export 不能问题

## 3.10.0 (2020-03-20)
* feat: 升级 `yyl-seed-webpack@2.2.0`
* feat: 升级 `yyl-hander@0.9.0`
* feat: 升级 `yyl-server@0.3.6`
* feat: 新增 支持 `writeToDisk` 选项， 以加快构建速度
* feat: webpack 类项目 运行 非 `--remote` `--isCommit` 模式下， 默认 writeToDisk 为 false
* feat: webpack 类项目 新增 环境提示 pop 注入到 entry 文件

## 3.9.5 (2020-03-11)
* feat: 调整log
* fix: 修复在 webpack 类项目 配置本地 devServer后， devServer 会启动失败问题

## 3.9.4 (2020-03-10)
* feat: 优化 log
* fix: 修复 webpack 类项目 通过sugar 替换的文件 hash 不会改变问题
* fix: 修复 webpack 类项目 通过sugar 替换的文件 `path/to/1.png?1234#adsf` 结果不符合预期的问题

## 3.9.3 (2020-03-06)
* feat: webpack类项目 watch 改为默认不打开 hmr 模式
* feat: webpack类项目 添加 `--livereload` 功能 若打开，则文件更新方式为自动刷新当前页
* feat: webpack类项目 添加 `--hmr` 功能 若打开，则文件更新方式为热更新
* feat: 新增 `yyl d`, 用于 本地开发
* feat: 新增 `yyl o`, 用于 打包
* feat: 新增 `yyl r`, 用于远程开发
* feat: 新增 `yyl w`, watch 缩写
* fix: 修复 webpack类项目 执行 `--remote` 时 `hot-update` 文件 会覆盖掉入口文件, 导致 js 执行不符合预期问题
* fix: 修复 webpack类项目在使用 `historyApiCallback` 时若没安装前置 依赖时 错误信息没出来的问题

## 3.9.2 (2020-03-03)
* fix: webpack 类项目 vue2 seed, 会出现 inherits 模块没找到的问题

## 3.9.1 (2020-03-03)
* fix: 修复 svg-inline 异常问题

## 3.9.0 (2020-03-03)
* feat: 正式发布

## 3.9.0-beta3 (2020-03-03)
* feat: webpack 类型项目支持配置中设置  `devServer` 配置项
* feat: 让 `devServer.historyApiCallback` 属性能在 proxy 模式下使用
* feat: 优化 error log
* feat: webpack 类项目 `entry/*.html`  `entry/*.pug` 支持 变量传入
* fix: 修复 webpack 类项目 sugar 执行不符合预期的问题

## 3.9.0-beta2 (2020-02-24)
* feat: 通过 happypack 对 `.js` 构建进行优化
* todo: 让 happypack 支持 `.ts` 类文件
* todo: 拆分 `webpack`, `requirejs` localserver 部分， 让 webpack使用自带的 `devserver`

## 3.9.0-beta1 (2020-02-23)
* feat: 重新划分 `webpack`, `requirejs` 构建策略
* feat: 优化 `webpack` 类项目构建速度， webpack seed 包自身实现完整的构建流程，不需依赖 `yyl-hander` 提供的 `afterTask`
* feat: 整合 `requirejs` 类项目, 将 `yyl-hander` 的 `afterTask` 整合到 seed 包里面
* feat: 每次构建成功后都能看到 homepage 地址
* feat: `config.resource` 支持 sugar 写法
* fix: fixed 19 of 21 vulnerabilities

## 3.8.3 (2020-02-21)
* feat: 让 yyl 支持 `__html()` 语法糖，用于引入 tmpl 文件
* feat: 优化 yyl init 在 使用者 npm 环境有问题时的提示文案

## 3.8.2 (2020-02-13)
* feat: rev 构建支持把 process.env 自定义参数打入 rev-manifest 文件
* feat: 补充 npm test 相关命令

## 3.8.1 (2019-12-04)
* feat: `webpack` `react+ts` 支持 执行项目自带 `typescript`

## 3.8.0 (2020-01-16)
* feat: `yyl init` 重构，初始化包支持独立更新
* feat: 独立拆分 单元测试， 调整目录结构

## 3.7.1 (2019-11-17)
* fix: 修复 `webpack` seed 与 `@yy/tofu-ui-react` 打包后不兼容问题

## 3.7.0 (2019-11-06)
* del: 去掉 `yyl make` 方法
* feat: 补充 `yyl server start --help` 内容

## 3.7.0-beta2(2019-09-20)
* fix: 修复 yyl 执行 all 命令后 不能顺利终止问题 

## 3.7.0-beta1(2019-09-20)
* feat: `proxy` `webPort` 从固定 `5001` 改为 跟随 `config.port` => `${config.port}1`
* feat: 优化 `yyl init` log 信息
* feat: yyl 项目 中文化
* feat: 优化 `yyl-seed-webpack` 配置
* feat: 项目依赖锁定
* feat: 给 `config.resource` 添加 watch 操作
* feat: 修改 通用 `yml` 文件 新增 `pre` 的发布环境
* feat: 新增 `config.localserver.entry` 参数
* feat: yyl 允许配置 本地服务器 而非默认 服务器了
* feat: `yyl.config.js` 支持 返回 function 对象 根据 env 动态配置 
* del: 去掉 `w-commit` 文件(已过时)
* del: 去掉 `domain` 模块


## 3.6.0-beta4(2019-07-31)
* feat: `mocha test` init 相关用例
* fix: 修复 `webpack base` `webpack react-ts` 2 个seed 包 初始化完后不能运行问题

## 3.6.0-beta3(2019-07-31)
* feat: `yyl init` 优化，如项目存在 `pkg.devDependencies` 会 自动运行 `npm install`
* feat: 补充 `commit-lint`
* feat: `webpack` seed 中如发现 `config.plugins` 为空 则不会额外引入 yyl server 本地的模块
* feat: `webpack` seed 模块地址 `~/.yyl/plugins/webpack` 改为 `~/.yyl/plugins/webpack/${config.name}`
* del: `webpack` seed 去掉 `lodash` 模块

## 3.6.0-beta2(2019-07-25)
* feat: `webpack` seed 新增 `config.base64Limit: number` 属性，用于自定义 `url-loader` limit 属性, 默认值为 3000
* fix: `webpack` seed 修复 当 package.json 中存在 `tj/react-click-outside` 构建会报错问题
* fix: 修复 `webpack vue2` 压缩 没生成 `async_component` 问题
* fix: 修复 `yyl init` 统计文件数量会扫描 `node_modules` 内文件的 bug
* fix: 修复 `webpack vue2` seed 初始化完 运行不了的问题

## 3.6.0-beta1(2019-07-19)
* feat: `webpack` seed 新增 `react-ts`, `react-ts-ie8` 2 种类型
* feat: `webpack` seed 新增 `config.babelrc: boolean` 属性，用于自定义 babelrc 
* feat: `webpack` seed 新增 `config.eslint: boolean` 属性，用于自定义 是否执行 eslint
* feat: `webpack` seed 新增 `husky` 提供 提交信息校验功能
* feat: `yyl init` 添加 seed 包加载 提示
* feat: `yyl init` 新增 `--ignoreInstall` 用于跳过 init 结束后 自动执行 `npm install` 操作
* feat: 新增 js 文件支持 `__url({$jsDest})` 模式
* feat: server 部分 改用 `yyl-server` 实现
* fix: 修复 `yyl watch` 安装 `config.plugins` 会出现 warning 问题
* fix: 调整 yml 文件， 修复自动测试 会额外生成 空文件的问题
* fix: 修复 `webpack` seed 下 js 部分 require js 没带上 hash 问题
* del: 去掉 `yyl proxy` 命令

## 3.5.1(2019-06-27)
* fix: 修复 `yyl init` 在 `webpack` `typescript` 里没有自动生成 `package.json` 问题`
* fix: 修复 `yyl watch` 在 `webpack` 会提示 autoprefixer wanning 问题
* feat: 内部统一使用 `yh.parseConfig()` 函数初始化 config

## 3.5.1-beta7(2019-05-31)
* fix: 修复 `yyl all --isCommit` 在 `vue2-ts` 下抽离css 部分会报错问题

## 3.5.1-beta6(2019-05-30)
* fix: 修复 `yyl all --isCommit` 在 `vue2` 下抽离css 部分会报错问题

## 3.5.1-beta5(2019-05-29)
* fix: 修复 `yyl server start` 路径不正问题

## 3.5.1-beta4(2019-05-29)
* fix: 修复 `webpack` 类 项目执行 `--isCommit` 操作时 样式中会包含 js 的问题
* fix: 修复 `yyl server start` 会报错问题

## 3.5.1-beta2(2019-05-21)
* feat: webpack babel 调整
* feat: `yyl watch --proxy` proxy server 不再单独新开窗口

## 3.5.1-beta1(2019-05-19)
* feat: `yyl init` 后 若发现存在 package.json 文件，则会自动执行安装处理
* feat: `yyl init` 后 若发现存在 package.json 文件，添加 npm 命令
* feat: `yyl init` 调整 `platform=both` 的 模块分割
* todo: `yyl init` both 情况下 ci 文件需调整
* todo: yyl init both 对应的 jest， e2e test 需要更新
* todo: `extFn.parseConfig` 发现在  w-proxy, w-server 中有调用， 待替换 

## 3.5.0 (2019-05-17)
* feat: 新增 `webpack` seed, 内置 `webpack`, `typescript`, `vue2`, `vue2-typescript` 4 种类型
* del: 去掉 `webpack-vue2` seed, 但会做向下兼容处理
* feat: 优化 `yyl init` 逻辑
* del: 去掉 `yyl init` 中的 svn 选项 以及相关逻辑

## 3.4.10 (2019-04-29)
* feat: 调整 yml 文件， 让发布支持 通过 `process.env.mode` 区分发布分支
* del: 去掉多余的文件

## 3.4.9 (2019-04-25)
* fix: 修复 `yyl watch --proxy` 后，触发 `watch` 时 rev 触发不了问题

## 3.4.8 (2019-03-17)
* feat: 更新 `yyl-seed-webpack-vue2` 到 `0.5.15` 添加 icon 支持

## 3.4.7 (2019-03-13)
* fix: 修复 log.warn 不会展开的问题
* [UPD] 更新 `yyl-seed-webpack-vue2` 到 `0.5.14` 去掉 `webpack-vue2` 自带的 `yyl-flexlayout`

## 3.4.7-beta2 (2019-02-26)
* feat: 解决遗留问题

## 3.4.7-beta1 (2019-02-25)
* feat: 遗留问题 `yyl init` both 时未处理好， 待后续版本更新

## 3.4.6 (2019-02-21)
* fix: 修复 gitlab-ci 遇到构建报错依然显示 pass 问题
* feat: 新增 每次启动清理 `anyproxy` 缓存功能
* feat: 新增 `yyl server clean` 会清除 anyproxy 缓存 的功能

## 3.4.5 (2019-02-21)
* fix: 更新 `yyl-seed-webpack-vue2` 到 `0.5.6` 修复 webpack-vue 老项目引入 `babel-polyfill` 会报错问题

## 3.4.4 (2019-02-19)
* fix: 更新 `yyl-seed-webpack-vue2` 到 `0.5.5` 修复 webpack-vue `import` 和 `module.exports` 混用报错问题

## 3.4.3 (2019-01-03)
* fix: 更新 `yyl-seed-webpack-vue2` 到 `0.5.4`

## 3.4.1 (2019-01-03)
* fix: 修复 在 `docker` 环境下 构建工具报错问题

## 3.4.0 (2019-01-02)
* feat: 接入 `yyt` 测试
* feat: 新增 `yarn` 配置
* feat: log 部分 ui 改造
* feat: 升级 `yyl-util` 到 `2.0` 版本
* feat: 改造 `extFn` `log` `vars` 部分代码

## 3.3.8 (2019-01-16)
* fix: 修复 `config.proxy.https` 配置无效问题
* fix: https 代理情况下 `livereload` 请求异常问题

## 3.3.7 (2019-01-03)
* feat: 更新 `yyl-seed-webpack-vue2` 到 `0.4.2` 修复 multi entry 时 html 内 js 包含所以 entry chunk 的问题

## 3.3.6 (2018-12-29)
* feat: 更新 `yyl-seed-gulp-requirejs` 到 `2.5.8` 将 初始化 入口 从 `demo.html` 改为 `index.html`
* feat: yyl 默认配置文件为 `yyl.config.js`, 找不到才去获取 `config.js` 作为配置文件
* feat: `yyl init` 初始化 生成的配置文件名字改为 `yyl.config.js`
* fix: 修复配置文件 只配置 `config.localserver`, `config.proxy` 时， `yyl server` 启动不了问题
* fix: 修复 `yyl watch` 没加 `--proxy` 仍然会启动 `proxy server` 的问题

## 3.3.5 (2018-12-26)
* feat: tpl 类型 文件 经过 any-proxy 默认允许跨域访问

## 3.3.4 (2018-12-25)
* fix: 修复 `yyl watch --name pc` 不会 把 `--name` 传到 proxy 那边 的问题
* feat: 升级 `yyl-seed-webpack-vue2` 到 `0.4.1` 支持 `config.px2rem` 配置项

## 3.3.3 (2018-12-17)
* feat: `config.proxy.https` 新增项， 设置为 `true` 才进行 https 代理
* [EIDT] 更新 `yyl-seed-gulp-requirejs` 到 `2.5.7` 修复 `config.mainHost`， `config.staticHost` 后不带 `/` 会生成路径不对问题

## 3.3.2 (2018-11-27)
* fix: 修复在手机上不能 热更新问题

## 3.3.1 (2018-11-27)
* fix: 修复在 新的 `anyproxy` 模式下 `__webpack_hmr` 不能正常代理问题
* feat: 初始化时将常用配置 属性 暴露到 `config.js` 下面

## 3.3.0 (2018-11-26)
* feat: yyl proxy 代理 接入 `any-proxy` 端口 `5001`

## 3.2.2 (2018-11-20)
* fix: ci 默认config 修改

## 3.2.1 (2018-11-19)
* fix: 更新 `yyl-seed-webpack-vue2` 到 `0.3.3` 来优化 `--remote` 样式不生效的问题

## 3.2.0 (2018-11-18)
* feat: 新增 `yyl proxy` 命令
* feat: seed `webpack-vue2` 支持 `hmr`
* feat: 将 `log('start', xx)` 统一放到 `w-cmd.js` 里面
* feat: `optimize` 包含 `localserver` 部分,  而 `proxy` 服务则独立新开窗口执行
* feat: `yyl commit` 代码逻辑优化
* feat: `yyl server` 代码逻辑优化

## 3.1.8 (2018-11-14)
* feat: 更新 `yyl-seed-webpack-vue2` 到 `0.2.8` 用来处理 `svg` 格式文件

## 3.1.7 (2018-11-14)
* fix: 修复 使用 `config.concat` 在 命令行 `--proxy` 不会补全 hostname 的问题

## 3.1.6 (2018-11-12)
* fix: 更新 `yyl-seed-webpack-vue2` 到 `0.2.5` 修复 `--NODE_ENV` 不生效问题

## 3.1.5 (2018-11-12)
* fix: 更新 `yyl-seed-webpack-vue2` 到 `0.2.4` 提供 `--NODE_ENV` 属性支持

## 3.1.4 (2018-11-08)
* fix: 更新 `yyl-seed-webpack-vue2` 到 `0.2.3` 来修复 项目 不支持 `.webp` 格式 问题

## 3.1.3 (2018-11-07)

* fix: 修复 `yyl` 构建不能正确识别 `config.platform` 属性问题

## 3.1.2 (2018-11-06)
* fix: 更新 `yyl-seed-gulp-requirejs` 到 `2.5.6` 来修复 `optimize.watch` 多次触发问题, 压缩出来的 js 不能在 ie8 下面运行问题
* feat: 调整 `yyl commit` 界面
* feat: 优化 `yyl server start` 功能

## 3.1.1 (2018-10-16)
* fix: 更新 `yyl-seed-gulp-requirejs` 到 `2.5.2` 来修复 `optimize` 路径替换异常问题

## 3.1.0 (2018-10-16)
* fix: 修复 `yyl init` 生成 没有 `.gitignore` 文件 问题

## 3.0.3 (2018-10-12)
* feat:  新增 `config.proxy.homePage` 属性 用于定义 默认打开的页面
* feat: 更新 `yyl-seed-webpack-vue2` 到 `0.1.7`

## 3.0.2 (2018-09-30)
* fix: 修复 ci 执行 `yyl all` 报错后不会终止的问题
* fix: 修复 `webpack-vue2` 执行带有 `@yy/tofu-ui` 会构建失败问题
* fix: 修复 `yyl commit` 界面显示不正常问题

## 3.0.1 (2018-09-30)
* feat: 将 `initPlugin` 存放目录挪到 `~/.yyl/plugin`
* fix: 修复 `gulp-requirejs` 下 生成 `t-xx.tpl` uglify 时 某种情况会导致 js报错的问题
* fix: 修复 `{$xx-xx}` 不被识别问题


## 3.0.0 (2018-09-29)
* feat: 优化构建逻辑 构建项目不再需要二次安装
* del: 去掉 `yyl examples`
* del: 去掉 `yyl supercall`
* del: 去掉 `yyl jade2pug`


## 2.26.0 (2018-09-18)
* fix: `webpack.publish.js`设置process.env.NODE_ENV=production
* feat: 新增vue2项目 通用alias
* feat: 新增vue2项目 vscode 支持文件 jsconfig.json

## 2.25.9 (2018-08-13)
* fix: `w-proxy` 有问题 先回档

## 2.25.8 (2018-08-13)
* feat: 适配 `linux` 环境

## 2.25.7 (2018-08-13)
* feat: 去掉没用的依赖 v2

## 2.25.6 (2018-08-10)
* feat: 去掉没用的依赖

## 2.25.4 (2018-08-09)
* feat: `config.plugins` 支持 `@yy/xxxx@version` 形式

## 2.25.3 (2018-08-08)
* feat: `config.plugins` 支持 `@yy/xxxx` 形式

## 2.25.2 (2018-08-06)
* fix: 调整 `gulp-requirejs` `no-component` example
* feat: `gulp-requirejs` 生成 `dest` 文件 地址保留 query 相关信息 如 `a.js?2018xxx`

## 2.25.1 (2018-08-01)
* fix: 修复 `webpack-vue2`, `webpack` 在 `watch --remote` 模式下构建 目录不正确问题

## 2.25.0 (2018-07-31)
* feat: `yyl 新增 mock 功能`
* feat: `webpack-vue2` `webpack` 中的 `async_component` hash 支持在 hash 映射表中显示

## 2.24.3 (2018-07-18)
* fix: 修复 `webpack-vue2` `webpack-vue2-for pc` 种子 不兼容 ie 10 问题

## 2.24.2 (2018-07-12)
* fix: 修复 `gulp-requirejs` watch 时 如 同目录下 同时存在 `a.js`, `a.js.bak` 时, 修改 `a.js` 不能正常触发 压缩逻辑的问题

## 2.24.1 (2018-07-06)
* feat: 优化 `rev-build` 与 `rev-update` 衔接逻辑
* fix: 修复 `gulp-requirejs` tpl 文件内 路径不会替换对应的 hash 问题
* fix: 修复 `gulp-requirejs` 中 路径替换 相对路径会出现 替换错误的问题

## 2.24.0 (2018-07-03)
* feat: 升级 yyl node 最低支持版本 为 `6.0.0`
* feat: 新增 `webpack-vue2`, `webpack` `process.env.NODE_ENV` 变量
* feat: 优化 `webpack-vue2`, `webpack` 构建速度
* feat: 优化 `yyl` throw error 逻辑

## 2.22.5 (2018-06-14)
* feat: 新增 `config.js` `disableHash` 配置项用于禁止项目生成 hash 文件

## 2.22.4 (2018-06-14)
* fix: 补充 `webpack` `webpack-vue2` 对 `.css` 文件的 解析支持

## 2.22.3 (2018-06-14)
* fix: 修复 yyl `gulp-requirejs` `watch` 检查 `pug` 文件 遇到 `include  ../w-giving\w-giving` 两个空格无法正常检测的问题

## 2.21.2 (2018-06-04)
* fix: 修复 yyl 运行时会出现 `express is not define` 错误的问题

## 2.21.1 (2018-06-03)
* fix: 修复 `gulp-requirejs` watch 时 如发生报错, 第二次执行时将不能正常完成 optimize 的问题

## 2.21.0 (2018-05-31)
* feat: `gulp-requirejs` 新增 `__url(path)` 语法糖 用于 js 中 获取 项目中静态资源地址
* fix: 修复 `gulp-requirejs` 打包出来的 项目会出现 本地目录路径问题

## 2.20.0 (2018-05-24)
* del: 去掉 `webpack-vue` 工作流
* feat: `webpack`, `webpack-vue2` 支持 异步加载 模块 功能

## 2.19.1 (2018-05-18)
* feat: `gulp-requirejs` 添加 svga 路径替换 需要替换成 主域名的逻辑

## 2.19.0 (2018-05-15)
* feat: `webpack-vue2` 新增 `postcss-loader`
* feat: `webpack-vue2` 新增 `autoprefixer`
* feat: `webpack-vue2` 新增 `postcss-px2rem`
* feat: `webpack-vue2` 新增 `eslint` 代码检查
* feat: 新增 `svga` 支持
* feat: `webpack` 新增 `postcss-loader`
* feat: `webpack` 新增 `autoprefixer`
* feat: `webpack` 新增 `postcss-px2rem`
* feat: `webpack` 新增 `eslint` 代码检查
* feat: `webpack-vue2` 优化 `single-project` 例子, 新增带有 `vuex` 使用例子
* feat: `config.js` 新增 `config.platform` 参数, `postcss` 在 `config.platform = mobile` 时会加入 `postcss-px2rem` 插件
* feat: `config.js` 新增 `eslint` 参数 配置是否使用 eslint
* feat: 简化 `yyl init` example 选择， 如果发现 example 只有 1个的时候 直接选择并跳过
* feat: `webpack-vue2` 升级 `webpack` 到 4.0
* fix: 修复 `webpack` 构建 在 window 下 运行不了了问题
* fix: 修复 `webpack-vue2` 每次都要重新安装 `config.plugins` 里面的组件的问题
* fix: 修复 `yyl commit --config` 无效问题


## 2.18.0 (2018-04-15)
* feat: 新增 `webpack` 构建类型
* del: 删除 `webpack-vue` 里面的 `no-components` 类型

## 2.17.6 (2018-04-12)
* fix: 修复 `webpack-vue2` 添加 `config.plugins` 参数会报错问题
* del: 去掉 `yyl init` 中 选择 `git or svn` 选项， 全部默认 `git 配置方案`
* feat: `yyl watch, yyl commit` 时 的 `init config` 新增 `config` 内的 参数校验
* feat: 补回 `webpack-vue` `webpack-vue2` 的 `{$config.alias[key]}` 语法糖

## 2.17.5 (2018-04-09)
* feat: 新增 `webpack-vue`, `webpack-vue2` 用 `eslintrc` `editorconfig` 配置文件
* feat: `yyl init` `mobile` 下 默认选中 `webpack-vue2`
* fix: 修复 `webpack-vue` 解析不了 `*.vue` 文件问题

## 2.17.4 (2018-04-04)
* feat: `gulp-requirejs` 中的 `inlinesource` 只会在 `iEnv.isCommit` 为 `true` 时有效
* fix: 修复 `gulp-requirejs` `watch` 命令后 tpl 代码不跟新问题
* fix: 修复 `gulp-requirejs` `watch` 时 `rutimefiles` 为 0 时 watch 不执行下去的 问题
* fix: 修复 `gulp-requirejs` `muti-project` 初始化运行不了问题
* fix: 修复 `gulp-requirejs` `no-components` 初始化运行不了问题

## 2.17.1 (2018-03-29)
* feat: `config.js`  新增 `config.commit.staticHost`, `config.commit.mainHost`
* feat: `gulp-requirejs` 模板新增压缩功能

## 2.17.0 (2018-03-27)
* feat: `gulp-requirejs` 新增 `/*exclude: <moduleName>,<moduleName>*/` 语法糖用于 `requirejs` 打包时 对特定模块进行不打包处理
* feat: `gulp-requirejs` 新增 `css inline`
* feat: `gulp-requirejs` 新增 `t-xx` 类型模块 用于输出 tpl文件

## 2.16.1 (2018-01-26)
* fix: 修复 `yyl server clear` 不会结束问题
* feat: 优化执行 `npm install ` 时看上去像没反应的问题

## 2.16.0 (2018-01-26)
* feat: `yyl` 新增 `--logLevel` 参数
* feat: `yyl` `config` 新增 `config.proxy.ignores` 参数
* feat: 简化 构建工具 `optimize` 时界面
* feat: 分离 `yyl watch` 中 `server` 与 `optimize` 到 两个独立的窗口
* feat: `yyl` 构建方式改成内联，不再通过 `util.runCMD(gulp watch)` 的方式进行调用
* del: 去掉 `yyl` 对 全局 `gulp` 的依赖
* del: 去掉 `yyl debug`
* del: 去掉 `yyl server rebuild` 方法

## 2.15.41 (2018-02-07)
* feat: 新增 `yyl optimize` 时 对项目版本要求的检查

## 2.15.40 (2018-02-07)
* fix: 修复 `config.resource` 为 null 时 构建报错问题

## 2.15.39 (2018-02-01)
* fix: `server error` bugfix

## 2.15.38 (2018-01-31)
* feat: 支持 `svga` 类型 图片

## 2.15.37 (2018-01-31)
* feat: 新增  `yyl --config [path]` 配置项

## 2.15.36 (2018-01-30)
* fix: 修复 `gulp-requirejs` 绝对地址匹配不正常问题

## 2.15.35 (2018-01-29)
* fix: `gulp-requirejs` `p-xx` 也同样需要监听 被其他 `p-xx` 调用的情况
## 2.15.34 (2018-01-29)
* fix: `gulp-requirejs` `p-xx` 也同样需要监听 被其他 `p-xx` 调用的情况

## 2.15.33 (2018-01-24)
* feat: 新增 `yyl all` 自测用例
* fix: 修复 `gulp-requirejs` 在`pug` 文件存在 `<style>` `style=""` 并带有图片时显示不正常问题
* fix: 修复 `webpack-vue` 在 mac os 上执行出错问题

## 2.15.32 (2018-01-18)
* fix: 修复 `gulp-requirejs` 运行 `supercall` 时 在 部分电脑内报错问题(`win10`?)

## 2.15.31 (2018-01-17)
* fix: 修复 `webpack-vue` 中 watch 重复执行问题
* fix: 修复 `yyl concat` css 文件 加 分号导致样式问题

## 2.15.30 (2018-01-17)
* fix: 修复 `yyl update` 执行失败问题

## 2.15.29 (2018-01-17)
* feat: 新增 `proxy` 日志， 当 `--logLevel > 1` 时会显示
* feat: 新增 `yyl server rebuild <projectName>`
* fix: 修复 `yyl init` 不能正常拷贝文件 问题

## 2.15.28 (2017-12-28)
* feat: `yyl init` 新增 `--name`, `--platform`, `--workflow`, `--init`, `--doc` 参数
* feat: 新增 `yyl update <package> <version>` 一键 update yyl 内所有 `package.json`, `package-lock.json` 中 组件版本 命令
* feat: 引入 `test` 模块
* feat: `yyl supercall rev-build` 新增 对 `html` 文件 路径 format 功能 (包括 相对路径 变绝对路径， 路径 `../`, `./` format)
* feat: `webpack-vue` `config.js` 新增 `resource` `concat` 属性配置项
* feat: `yyl server start` 新增 `--proxy` 参数， 可以同时启动 server 和 proxy
* feat: 新增 `yyl info` 用来显示当前项目 构建信息
* feat: html 生成 现 支持 `{$alias}` 语法糖，生成后会自动替换成 `config.alias` 内对应的地址并 处理好相对位置
* feat: `webpack-vue` rev 构建模式 改用全局的 `supercall rev-build`, `supercall rev-update` 方法
* del: 去除 `yyl init` 中 `platfrom` 可以多选 `pc` 和 `mobile`， 改为 `单选`
* fix: 捕抓 `proxy` 中 出现的 `connect ECONNREFUSED` 错误, 不让这错误打印到 log 中
* fix: 修复 `webpack-vue2` 运行报错问题
* TODO 新增 `__inline(path)` `__url(path)` js 语法糖 用于js 中 直接引入 模板文件内容 和 url 地址

## 2.15.27 (2017-12-14)
* feat:`config.js` 中 在 `config.onBeforeCommit` 和 `config.svn[branches].onBeforeCommit` 两个地方都可配置 提交前的操作, 其中优先级是后者比前者优先级要高

## 2.15.26 (2017-12-12)
* feat: 升级 `gulp-requirejs` 中 `jade` 为 `pug`, 升级后不再对 `*.jade` 文件进行渲染，只对 `*.pug` 文件渲染
* feat: 新增 `yyl jade2pug` 命令 一键把原有项目中的 `*.jade` 格式转成 `*.pug` 格式

## 2.15.24 (2017-12-11)
* feat: 锁定 `gulp-requirejs`, `gulp-rollup`, `webpack-vue`, `webpack-vue2` 中 `package.json` 依赖组件的版本
* feat: `gulp-requirejs`, `gulp-rollup` 新增 `--remote` 选项
* feat: 新增 `yyl make` 功能
* feat: `yyl update` 功能完成
* feat: `gulp-requirejs`, `gulp-rollup` 支持在 `p-xx.jade` 里面直接引用 `p-xx.scss` 构建工具会自动转义成 `xx.css`
* fix: 修复 `gulp-rollup` 在 `watch` `p-xx-xx` 时 修改 `jade` 不会触发更新问题

## 2.15.23 (2017-12-01)
* fix: 修复 `gulp-requirejs`, `gulp-rollup` 运行 会报错问题 

## 2.15.22 (2017-11-30)
* fix: 修复 `gulp-requirejs`, `gulp-rollup` `jade` 中 `<script type="type/html"></script>` 路径不会替换的问题

## 2.15.21 (2017-11-22)
* feat: 优化 `yyl supercall rev-build`,  `yyl supercall rev-update` 信息展现
* fix: 同步更新 `gulp-rollup` `yyl watch` 时 如果 `w-xx` 组件 引用 `w-xx2` 组件时， 修改 `w-xx2` 组件 不会进行相应的更新 的问题

## 2.15.20 (2017-11-21)
* feat: 调整`yyl-util` `vars` 变量到 yyl 主干下， 不再放置于 `yyl-util` 组件内
* feat: 调整`yyl-util` `livereload()`, `initConfig()` 变量到 yyl 主干下， 不再放置于 `yyl-util` 组件内
* fix: 修复 `gulp-requirejs` `yyl watch` 时 如果 `w-xx` 组件 引用 `w-xx2` 组件时， 修改 `w-xx2` 组件 不会进行相应的更新 的问题

## 2.15.17 (2017-11-20)
* feat: `gulp-rollup` 工作流 `yyl watch` 优化，能自动检测需要构建的文件, 不再是 整个 task 的去运行

## 2.15.16 (2017-11-17)
* feat: `gulp-requirejs` 工作流 `yyl watch` 优化，能自动检测需要构建的文件, 不再是 整个 task 的去运行

## 2.15.15-beta1 (2017-11-14)
* fix: 修复 `svn commit` 在高版本 svn `1.9.7` 提交经常出错问题

## 2.15.15 (2017-11-14)
* fix: 修复 `gulp-requirejs`, `gulp-rollup` 打包不会压缩 js 的问题

## 2.15.14 (2017-11-11)
* feat: 将 `gulp-requirejs`, `gulp-rollup` 中  `rev` 相关任务提取到 `yyl supercall rev-update`, `yyl supercall rev-build` 作为通用方法
* feat: 优化 `yyl commit` svn 提交逻辑， 执行 `svn update` 之前不会进行目录清空操作
* fix: 修复 `gulp-requirejs`, `gulp-rollup` 中只修改图片 样式 hash 不更新问题

## 2.15.13 (2017-11-10)
* feat: 新增 `yyl commit` 时 `--nooptimize` 参数

## 2.15.12 (2017-11-10)
* feat: 优化 `gulp-requirejs`, `gulp-rollup` 中 log 显示
* fix: 修复 `gulp-requirejs`, `gulp-rollup` 执行 `yyl watch --proxy` 后 `js` 部分修改后无法正常更新问题

## 2.15.10 (2017-11-08)
* fix: `gulp-requirejs`, `gulp-rollup` 中 `html-dest` 图片地址替换问题修复(陈年老bug)

## 2.15.9 (2017-11-07)
* feat: `gulp-requirejs` 中 `yyl watch` 不再在 `src` 目录下生成文件
* feat: 重构 `gulp-requirejs`, `gulp-rollup` 中 stream 流部分代码

## 2.15.8 (2017-11-03)
* fix: 修复 `yyl commit` 会吧 `x.json` 文件一起压缩问题

## 2.15.7 (2017-11-02)
* fix: 修复 `yyl wath --proxy` js 修改后文件不更新问题

## 2.15.6 (2017-11-02)
* feat: 优化 `yyl wath` log 展示

## 2.15.5 (2017-11-02)
* fix: 修复 调整 `config.revRoot` 会导致 目录生成错误问题

## 2.15.4 (2017-11-01)
* fix: 修复 `yyl watch --rev remote` 不会获取映射文件问题

## 2.15.3 (2017-11-01)
* fix: 修复 `yyl commit` 不会对文件进行压缩 问题

## 2.15.2 (2017-10-31)
* fix: 修复 `onInitConfig` 不生效问题

## 2.15.0 (2017-10-30)
* feat: `config.js` 新增  `onInitConfig` 属性

## 2.14.6 (2017-10-25)
* fix: 修复 `yyl watch` 时运行 buffer 超过 200k 时会出现 maxbuffer 的问题, 改用 `spawn` 运行

## 2.14.5 (2017-10-24)
* fix: 修复 `gulp-requirejs` 工作流中 watch 操作一次文件变更会触发几次 livereload 的问题

## 2.14.3 (2017-09-16)
* feat: 工作流 新增 对 `webp` 格式图片 支持

## 2.14.3 (2017-09-14)
* feat: `yyl-util` 版本更新以修复 `yyl watch --proxy` 时不能跳到正确地址问题

## 2.14.2 (2017-09-13)
* feat: 新增 `yyl update` 自动更新

## 2.14.0 (2017-09-13)
* feat: `yyl watch --proxy` 时默认打开的 html 如 遇到 default.html index.html 时 优先打开
* feat: 完善各项目构建时的 `README.md` 文档
* feat: 将 `yyl watch` 执行后的处理整合到同一个文件里面

## 2.13.7 (2017-07-21)
* fix: 修复 `webpack-vue`, `webpack-vue2` 工作流 执行 `--ver remote --sub trunk` 时不能生成远程映射回来的文件问题
* fix: 修复 `webpack-vue`, `webpack-vue2` 在 node 4.x 下运行报错问题

## 2.13.5 (2017-07-13)
* fix: 改善 `gulp-requirejs` 工作流 `run-sequence` 执行过多问题

## 2.13.3 (2017-07-05)
* fix: 暂时屏蔽在 html 文件中加 proxy 提示的功能， 等完善后再上

## 2.13.2 (2017-07-05)
* fix: 修复 执行 `--proxy` 时 在 ie 浏览器下 由于没有设置 content-type 导致样式识别不了问题

## 2.13.1 (2017-07-05)
* fix: 更新 `yyl-util` 到 `1.3.7` 以解决 执行 `util.runCMD` 方法时到一定情度的时候会触发 `maxBuffer error`

## 2.13.0 (2017-07-03)
* feat: 工作流 如果设置了 `config.proxy.localRemote` 并指向本地域名(`127.0.0.1:port`), 在运行工作流时设置 `--proxy `, 会优先打开该域名底下的当前文件
* feat: 工作流 使用本地代理 访问外网站点是右下角会出现 `yyl proxy` 文字提醒

## 2.12.0 (2017-06-30)
* feat: 工作流 `webpack-vue`, `webpack-vue2` 的 `config.js` 中 新增 `entry`, 对应 webpack.config.js 中的 entry 字段
* feat: 代理组件 中 新增 映射 log, 方便排查
* del: 删除 `webpack-vue` example 中的 `es6`, `with-global-component` 例子

## 2.11.0 (2017-06-26)
* feat: 工作流 `gulp-requirejs`, `rollup` 的 `config.js` 中 新增 `resource` 属性用于自定义开发项目中需要一并打包同步到dist的文件夹
* feat: 工作流 `README.md` 中 新增 对 打包命令的 例子说明

## 2.10.1 (2017-06-22)
* fix: 修复在config.commit.hostname 中填写 不带协议的 url如 `//www.testhost.com` 时，路径替换出错问题

## 2.10.0 (2017-06-19)
* del: 去掉不完善的 `browserify-babel` 工作流
* feat: 调整 工作流中 `config.js` 的默认设置
* feat: 工作流跑起时新增组件 version 对比
* feat: 优化工作流 watch 队列执行机制

## 2.9.0 (2017-06-07)
* feat: 本地服务器内文件 支持 post 请求获取

## 2.8.5 (2017-06-07)
* feat: 如果 proxy 访问域名 映射回本地服务器， 则在 header 添加 cache-control: no-cache 禁掉缓存

## 2.8.4 (2017-06-06)
* fix: 修复 proxy 环境下 post 请求一直 padding 问题
* feat: 完善 `gulp-requirejs`, `browserify-babel`, `rollup`, `webpack-vue`, `webpack-vue2` 中对本地代理部分的说明

## 2.8.3 (2017-06-06)
* feat: yyl watch 如果有 index.html, default.html 会优先打开
* feat: 优化 `gulp-requirejs` 冒泡提示功能
* fix: 修复 `gulp-requirejs`, `browserify-babel`, `rollup` 中 rev 过滤 md5 文件时会过滤掉一些正常文件的问题
* fix: 修复 通过 proxy 代理访问其他页面容易出现 `socket hang up`, `connect ECONNREFUSED` 错误问题

## 2.8.2 (2017-06-05)
* fix: 修复 `gulp-requirejs`, `browserify-babel`, `rollup` 中 压缩js 不会匹配 p-xx-xx.js 问题

## 2.8.1 (2017-06-02)
* fix: 修复 `webpack-vue`, `webpack-vue2` 在执行 `yyl watch --ver remote` 时报错问题

## 2.8.0 (2017-06-01)
* feat: `gulp-requirejs`, `rollup`, `browserify-babel` 模式下 测试数据(模拟接口返回)统一存放在 `js/data/` 目录下的 json 文件, 工程将会 同步到 `config.jsDest` 设置的目录下面

## 2.7.4 (2017-05-31)
* fix: bugfix

## 2.7.4 (2017-05-31)
* fix: bugfix

## 2.7.3 (2017-05-31)
* fix: 修复 yyl watch 时如 localserver.root 不存在时会出现本地服务器创建目录不对问题

## 2.7.2 (2017-05-31)
* fix: 修复 当 jade 文件中 存在 p-xx-xx 写法时， 图片路径替换不生效问题
* feat: 更新 gulp-requirejs, browserify-babel, rollup 中 jade 文件 引入图片的方法说明
* feat: 更新 yyl init 时 各 工程中 对 proxy 中的初始化设置

## 2.7.1 (2017-05-26)
* feat: rollup 工作流支持 js 内部this 和 module.exports 方式

## 2.7.0 (2017-05-26)
* feat: 新增 yyl watch 等打包操作时 新增 --silent 参数，用于配置 是否隐藏冒泡提示

## 2.6.2 (2017-05-25)
* feat: proxy server 增加在设置 localRemote 将 域名指向本地服务器时， 127.0.0.1 localserver 中找不到资源，会透传到线上 逻辑

## 2.6.1 (2017-05-25)
* feat: 调整 proxy 部分 log

## 2.6.0 (2017-05-24)
* feat: 新增本地代理功能(告别 fillder)
* del: 去掉 yyl init 初始化时询问是否查找 common 目录的功能

## 2.5.0 (2017-05-20)
* feat: 完善 rollup 工作流

## 2.4.2 (2017-05-19)
* feat: 完善 readme 文档
* feat: 完善 config.js 说明

## 2.4.1 (2017-05-18)
* fix: 修复在 node 4.x 运行 webpack-vue2 出现组件欠缺问题
* fix: 修复 执行 yyl server clear 后, config.plugins npm install 路径不对问题
* feat: 初始化增加 扫描 package.json 里面的 dependencies 属性 来进行 npm install
* feat: 优化 yyl server clear 命令

## 2.4.0 (2017-04-11)
* feat: 新增 rollup 工作流
* [WARN] 发现 browserify 工作流中 模板 必须 使用 module.export = xx 方式结尾， 不能使用 export default 方式， 待修复
* feat: 完善 svnConfig.onBeforeCommit 功能

## 2.3.5 (2017-04-07)
* fix: 去掉多余的代码

## 2.3.4 (2017-04-07)
* fix: 修复 vue 文件 es6 语法不编译问题

## 2.3.3 (2017-04-05)
* fix: 修复 yyl watch --ver remote 时 再次更新 rev-manifest.json 文件显示不正常问题

## 2.3.2 (2017-04-05)
* fix: rev-update 时 报错问题

## 2.3.1 (2017-04-05)
* feat: 将 vue-loader sass 模块 也当做 scss 模块进行编译

## 2.3.0 (2017-04-05)
* feat: 将 webpack-vue2 改用为 webpack2

## 2.2.1 (2017-03-28)
* fix: 修复 webpack-vue, webpack-vue2 组件clean 报错问题
* feat: 更新 每个 example 里面 对 flexlayout 组件引用 的版本
* feat: yyl commit 时会自动清除 dest 文件夹内容

## 2.2.0 (2017-03-28)
* feat: 新增 各工作流 optimize, watch task 时会出现 notify 提示

## 2.1.1 (2017-03-27)
* feat: webpack-vue2 example bug fix

## 2.1.0 (2017-03-27)
* feat: 新增 webpack-vue2 yyl 初始化工程

## 2.0.5 (2017-03-27)
* fix: 修复 yyl 初始化时 由于 yyl 全局安装是处在 node_modules 文件夹下， 而拷贝文件时又设置了 跳过 node_modules 文件夹的操作， 导致拷贝失败问题

## 2.0.4 (2017-03-27)
* fix: 修复 yyl 初始化组件时 只生成 dist 空文件问题

## 2.0.3 (2017-03-27)
* feat: 新增组件 调试命令 yyl debug

## 2.0.2 (2017-03-27)
* fix: 修改 bin/init.js 文件格式为 unix (修复mac 系统下安装完会出错问题)

## 2.0.1 (2017-03-09)
* feat: 修改 package.json 组件依赖

## 2.0.0 (2017-03-09)
* feat: yyl 命令安装改为通过 npm install yyl 方式全局安装
* del:  去除 yyl update 方法

## 1.12.1 (2017-02-23)
* fix:  去掉安装/ 卸载时对 yyl-util 的依赖

## 1.12.0 (2017-01-11)
* feat: 将 yyl-util, yyl-color 提取到 npm 上面

## 1.12.0 (2017-01-11)
* feat: 将 yyl-util, yyl-color 提取到 npm 上面

## 1.11.2 (2017-01-09)
* feat: vue-webpack 支持 多个entry 中 单独渲染 自己的 css 文件
* fix: 修复 vuewebpack 里面 jade 模板渲染不了问题
* fix: 修复 vuewebpack 里面 css 文件名称 不跟 entry 定义问题
* fix: 修复 vue-webpack demo 中 no-component 里面 head标签 缺少闭合问题

## 1.11.0 (2017-01-06)
* feat: yyl rm 句柄，方便卸载 node_modules 文件
* feat: 新增 软件卸载用 uninstall.bat, uninstall.sh 文件
* feat: 将组件 安装, 卸载 改用 命令行代替

## 1.10.0 (2017-01-05)
* fix: 修复程序在 node 5+ 上面 运行缺失部分 nodecomponents 的问题
* feat: webpack-vue 下 html 文件 新增 可直接 用 img 标签引用 图片
* feat: 新增 yyl example 命令

## 1.9.0 (2017-01-05)
* feat: vue-webpack 类工作流 新增 no-components 模式

## 1.8.0 (2017-01-03)
* feat: yyl config 下 如设置 config.commit.revAddr 为空 or false, 则不会生成 md5相关文件

## 1.7.0 (2016-12-30)
* feat: yyl webpack-vue 下 js 目录下也支持 打包输出

## 1.6.0 (2016-12-30)
* feat: yyl webpack-vue 模式下新增可支持 自定义 webpack.config
* feat: yyl config 新增 plugins 字段 用于设置额外需要安装的 npm package

## 1.5.1 (2016-12-26)
* fix: 修复 util.buildTress 函数目录树展示问题
* feat: 调整 yyl init 生成的 目录结构
* feat: yyl 执行时添加 版本检测


## 1.5.0 (2016-12-24)
* feat: 新增执行 yyl init 后, config 中会带有 当前 yyl version, 方便之后如果更新出现问题能回滚到特定版本
* feat: yyl update 支持更新到指定版本
* feat: rev 生成映射表时 如只更新 images 图片， 其他相关 html, css 也会一同更新 hash
* feat: 新增 yyl watch 图片更新立即生效

## 1.4.0 (2016-12-23)
* feat: yyl init 命令 新增 可选 初始化 no-components, multi-project 等初始化 类型


## 1.3.0 (2016-12-22)
* feat: 新增 webpack-vue mobile 可配置多个入口
* fix: 修复 browserify-babel example 中 no-components 用例运行不了问题

## 1.2.0 (2016-12-13)
* feat: 新增 vue-webpack 移动端工作流

## 1.1.0 (2016-12-08)
* feat: 新增 webpack-vue mobile 用 工作流
* feat: 新增 browserify-babel pc用 es6 工作流

## 1.0.0 (2016-12-07)
* feat: 诞生
