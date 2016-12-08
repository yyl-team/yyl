# 构建说明

## 环境说明
项目基于 `webpack + vuejs + gulp` 搭建, 需要在 `node >= 4.0.0` 环境下运行

### 全局安装以下组件
```unix
$ npm install webpack webpack-dev-server -g
```

## 项目初始化
```unix
$ npm install && npm init
```

## 命令说明

通过 gulp 执行 webpack 打包

```unix
$ gulp all
```

```unix
$ gulp webpack
```


通过 gulp 执行 webpack 打包 并建立本地服务器
```unix
# <type> 分支版本
#        - remote 拉取远程 md5hash 列表
$ gulp watch --ver <type>
```

提交代码到 各个 svn
```unix
# --sub 提交分支 test|release|trunk
# --git 是否拉取最新 git 代码
$ gulp commit --sub <branch> --git
```


