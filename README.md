# yyl 3.0
* `yyl` 内包含 适用于 `PC` 的 `gulp-requirejs` 和 适用于 `mobile` 的 `webpack-vue2` 2种前端构建方案
* 提供 `svn 自动提交` 和 `gitlab-ci` 两种 打包方式

## 环境
* 需要 node  `>= 8.0.0`

## 安装
```
npm install yyl -g
```



## SDK
### yyl
```
Usage: yyl <command>

Commands:
    init     项目初始化
    info     项目信息
    watch    执行打包并建立本地服务器监听
    all      执行打包操作
    server   yyl本地服务相关命令
    commit   提交代码到 svn/git
    make     创建模块


Options:
    -h, --help    帮助信息
    -v, --version 版本信息
    -p, --path    本程序目录
    --config      自定义 config 文件
```

### yyl init
用于 项目初始化
```
Usage: yyl init

Commands:

Options:
```

### yyl info
用于查看 yyl 项目信息
```
Usage: yyl info

Commands:

Options:
```

### yyl all, yyl watch
压缩相关命令 包含 `yyl all`, `yyl watch`
```
Usage: yyl <command>

Commands:
    watch     打包并建立本地服务器监听文件
    watchAll  打包并建立本地服务器监听文件
    all       打包文件

Options:
    --name <name>   用于存在个多项目的工程，
                    name: 与config 里面的 配置保持一致
    --remote        同 --ver remote
    --proxy         开启本地代理服务(需要配置 config.proxy 参数)
```

### yyl commit
用于 发布 项目（适用于 svn 提交发布潜龙）
```
Usage: yyl commit <command>

Commands:

Options:
    --name <name>    用于存在个多项目的工程，
                     与config 里面的 配置保持一致

    --sub <branches> 分支信息用于 执行 commit 操作 或者
                     在 watch 时 生成和服务器 rev-manifest 一样资源文件

    --nosvn          不执行 svn 相关操作
    --config         自定义 config 文件
```

### yyl server
本地 server 相关命令
```
Usage: yyl server <command>

Commands:
    clear            清空本地服务文件夹

    start            在当前文件夹建立本地服务器

Options:
    --proxy       配合 start 使用, 启动服务器同时启动 proxy 服务
    -h, --help    帮助信息
    -p, --path    打开本地服务所在路径
```

#### https 证书信任设置
[这里](http://note.youdao.com/noteshare?id=76e426d3d815b614b7c2092f0ff16167)

#### mock 相关说明
##### mock 目录
```
| + src
| ~ mock
|   | - db.json
|   ` - routes.json
` + dest
```

##### api 参照
[https://github.com/typicode/json-server](https://github.com/typicode/json-server)

##### 尚未实现
* ?_embed
* ?_expand

##### 额外实现 jsonp 用
* ?callback
* ?jsonp

### yyl rm
可以帮助快速删掉 node_modules 文件夹 `yyl rm node_modules`
```
Usage: yyl rm <dirname>

```
