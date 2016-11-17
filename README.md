# yylive work flow 说明文档
## 环境说明
项目基于 `node, gulp` 搭建, 需要在 `node >= 4.0.0` 环境下运行

### windows 用户
双击 `install.bat` 全局安装构建工具 - yyl

### mac 用户
* 方式一：拖动 `install.sh` 到终端 按回车运行 全局安装构建工具 -yyl
* 方式二：用 终端 运行 `install.sh`

## 命令说明
```
# 项目初始化
$ yyl init
$ yyl init -f
$ yyl init -h

# 版本信息
$ yyl -v
$ yyl --version

# 帮助信息
$ yyl -h
$ yyl --help
$ yyl

# 打开项目当前路径
$ yyl -p
$ yyl --path

# 构建项目命令
$ yyl html
$ yyl images
$ yyl css
$ yyl js
$ yyl all
$ yyl watchAll

# 服务器相关命令
$ yyl server init
$ yyl server -p
$ yyl server -h
```

## todolist
需要搭建的环境有 gulp + requirejs、 webpack + vuejs、 webpack + react
