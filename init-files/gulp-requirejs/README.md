# yy.com-v1 项目
## 构建环境说明
### 开发 git
```
http://code.yy.com/ent-FEteam/yy.com.git
```

### host
```

```

### 环境要求
运行此项目， 你电脑上必须安装以下组件:
* node
* ruby
* gulp
* sass

### 初始化目录
```Bash
$ gem install sass
$ gem install compass
$ npm install
```



### gulp 命令

```Bash
# 压缩合并 js
gulp js --name <project>

# 压缩合并 css
gulp css --name <project>

# 压缩合并 jade,html
gulp html --name <project>

# 压缩合并 image
gulp images --name <project>

# 压缩合并 执行 js、css、html、images
gulp all --name <project> --ver <version>

# 执行监听
gulp watch --name <project>

# 压缩合并 执行 all 并且 监听
gulp watchAll --name <project> --ver <version>

# 拷贝 config.copy 下的文件
gulp copy --name <project>

# 提交代码 到 测试/ 预发布环境
gulp commit --name <project>  --sub <branch> --ver <version>
```

```
@param <project>:  pc|mobile-index|mobile-play|mobile-ulink
@param  <branch>:  dev|commit|trunk
@param <version>:  线上 rev-manifest 版本，如要线上最新则填 remote
```


### livereload 

* 安装 插件[这里](https://chrome.google.com/webstore/detail/livereload/jnihajbhpnppcggbcgedagnkighmdlei)

* 打开chrome 扩展程序 [chrome://extensions/] 对插件 勾选 允许访问文件网址

* 打开 html 文件时 点击 chrome 上面图标激活插件

### 自定义配置文件
1. 在根目录 创建 `config.mine.js` 文件
2. 把要 config.js 中需要自定义的 属性 存放在 config.mine.js 文件。 demo 如下

```js
var config = {
    'pc': {
        svn: {
            path: {
                dev: '../../../svn.yy.com/yy-music/web-dragon/star-fans/yyweb/branches/develop',
            }
        }
    }
};

module.exports = config;
```

## yy.com 项目开发规范
yy.com 项目采取 组件化开发流程， 所有 页面， 控件都基于 components 目录内 组件 的互相引入,调用， 最终生成对应页面的 html, js, css



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
* p-xx.jade 文件开发范例[点击这里](./src/pc/components/p-demo/p-demo.jade)
* p-xx.scss 文件开发范例[点击这里](./src/pc/components/p-demo/p-demo.scss)
* p-xx.js   文件开发范例[点击这里](./src/pc/components/p-demo/p-demo.js)

其中 样式中 图片的引入直接基于当前目录进行引入即可， 构建工具会自动纠正如：

需要引入当前 images 目录下的 logo.png
```
p-liveplayerToolbar
|- p-liveplayerToolbar.js
|- p-liveplayerToolbar.jade
|- p-liveplayerToolbar.scss
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


### 模块 组件 w-xx 开发规范

#### 构建流程介绍
w-xx 类组件属于组件级别 组件，在生成时 `不会有` 自己独立的 html, js, css, 只有在被 引用的时候才会把对应的 scss, js, jade 合并到 引用方。

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
* w-xx.jade 文件开发范例[点击这里](./src/pc/components/w-demo/w-demo.jade)
* w-xx.scss 文件开发范例[点击这里](./src/pc/components/w-demo/w-demo.scss)
* w-xx.js   文件开发范例[点击这里](./src/pc/components/w-demo/w-demo.js)

## 潜龙 svn 地址:

### dev
```
https://svn.yy.com/yy-music/web-dragon/star-fans/yyweb/branches/develop
```

### commit
```
https://svn.yy.com/yy-music/web-dragon/star-fans/yyweb/branches/commit
```

### trunk
```
https://svn.yy.com/yy-music/web-dragon/star-fans/yyweb/trunk
```

## git 分支发布规范

执行发布潜龙之前需要先把 潜龙svn 的 dev, commit, trunk 目录拉取下来。最好按照 [git, svn 项目路径配置] 里面说定义的路径进行拉取

### dev 分支
dev 分支对应 潜龙 svn 的 dev 测试环境，每次需要将开发分支发布到 测试环境时 需要执行以下操作：
* 1.切换到 master 分支， 拉取最新的线上代码
* 2.切换到 当前开发分支， 并将 master 分支合并到 开发分支
* 3.切换到 dev 分支， 将 开发分支 合并到 dev 分支上面
* 4.执行以下命令将 dev 分支 提交到潜龙
```
gulp commit --name pc --sub dev
```
* 5.打开 [潜龙](http://bigdragon.yy.com/bussiness/buss/list.jsp)  -> 创建发布单 -> 
* 6.进入 潜龙系统 -> yy.com 网站 -> 查看项目 -> yy.com 网站静态资源
* 7.分支版本构建 选择 develop ->  环境选择 勾选 测试环境 -> 从 表单中输入当前开发分支的版本号 -> 点击操作中的 构建
* 8.构建完后，勾选新增的版本分支，点击左下方的保存按钮
* 9.进入 发布单界面后 勾选 116.31.121.211 机器， 然后点击发布所选
* 10.如发布中涉及jsp修改，继续往下执行
* 11.回到创建发布单界面，在项目选项中选中 yy.com JSP发布
* 12.分支版本构建 选择 develop ->  环境选择 勾选 测试环境 -> 从 表单中输入当前开发分支的版本号 -> 点击操作中的 构建
* 13.构建完后，勾选新增的版本分支，点击左下方的保存按钮
* 14.进入 发布单界面后 勾选 116.31.121.211 机器， 然后点击发布所选

### commit 分支
commit 分支对应 潜龙 svn 的 commit 测试环境，每次需要将开发分支发布到 测试环境时 需要执行以下操作：
* 1.切换到 master 分支， 拉取最新的线上代码
* 2.切换到 当前开发分支， 并将 master 分支合并到 开发分支
* 3.切换到 commit 分支， 将 开发分支 合并到 dev 分支上面
* 4.执行以下命令将 commit 分支 提交到潜龙
```
gulp commit --name pc --sub commit
```
* 5.打开 [潜龙](http://bigdragon.yy.com/bussiness/buss/list.jsp)  -> 创建发布单 -> 
* 6.进入 潜龙系统 -> yy.com 网站 -> 查看项目 -> yy.com 网站静态资源
* 7.分支版本构建 选择 commit ->  环境选择 勾选 测试环境 -> 从 表单中输入当前开发分支的版本号 -> 点击操作中的 构建
* 8.构建完后，勾选新增的版本分支，点击左下方的保存按钮
* 9.进入 发布单界面后 勾选 14.17.108.184 机器， 然后点击发布所选
* 10.如发布中涉及jsp修改，继续往下执行
* 11.回到创建发布单界面，在项目选项中选中 yy.com JSP发布
* 12.分支版本构建 选择 commit ->  环境选择 勾选 测试环境 -> 从 表单中输入当前开发分支的版本号 -> 点击操作中的 构建
* 13.构建完后，勾选新增的版本分支，点击左下方的保存按钮
* 14.进入 发布单界面后 勾选 116.31.121.211 机器， 然后点击发布所选


### 138test 分支
138test 分支对应 潜龙 svn 的 预发布环境，在项目上线前必须先将代码合并到 138test 测试后没问题 才能合并到 master 分支

每次需要将开发分支发布到 预发布环境时 需要执行以下操作：
* 1.切换到 master 分支， 拉取最新的线上代码
* 2.切换到 当前开发分支， 并将 master 分支合并到 开发分支
* 3.切换到 138test 分支， 将 开发分支 合并到 138test 分支上面
* 4.执行以下命令将 138test 分支 提交到潜龙
```
gulp commit --name pc --sub trunk
```
* 5.打开 [潜龙](http://bigdragon.yy.com/bussiness/buss/list.jsp)  -> 创建发布单 -> 
* 6.进入 潜龙系统 -> yy.com 网站 -> 查看项目 -> yy.com 网站静态资源
* 7.分支版本构建 选择 trunk ->  环境选择 勾选 预发布环境 -> 从 表单中输入当前开发分支的版本号 -> 点击操作中的 构建
* 8.构建完后，勾选新增的版本分支，点击左下方的保存按钮
* 9.进入 发布单界面后 勾选 138 机器， 然后点击发布所选
* 10.如发布中涉及jsp修改，继续往下执行
* 11.回到创建发布单界面，在项目选项中选中 yy.com JSP发布
* 12.分支版本构建 选择 trunk ->  环境选择 勾选 预发布环境 -> 从 表单中输入当前开发分支的版本号 -> 点击操作中的 构建
* 13.构建完后，勾选新增的版本分支，点击左下方的保存按钮
* 14.进入 发布单界面后 勾选 138 机器， 然后点击发布所选

### master 分支

master 分支对应 潜龙 svn 的 线上环境

每次需要将开发分支发布到 预发布环境时 需要执行以下操作：
* 1.切换到 master 分支， 拉取最新的线上代码
* 2.切换到 当前开发分支， 并将 master 分支合并到 开发分支
* 3.切换到 master 分支， 将 开发分支 合并到 master 分支上面
* 4.执行以下命令将 master 分支 提交到潜龙
```
gulp commit --name pc --sub trunk
```
* 5.打开 [潜龙](http://bigdragon.yy.com/bussiness/buss/list.jsp)  -> 创建发布单 -> 
* 6.进入 潜龙系统 -> yy.com 网站 -> 查看项目 -> yy.com 网站静态资源
* 7.分支版本构建 选择 trunk ->  环境选择 勾选 正式环境 -> 从 表单中输入当前开发分支的版本号 -> 点击操作中的 构建
* 8.构建完后，勾选新增的版本分支，点击左下方的保存按钮
* 9.进入 发布单界面后 勾选 所有 机器， 然后点击发布所选
* 10.如发布中涉及jsp修改，继续往下执行
* 11.回到创建发布单界面，在项目选项中选中 yy.com JSP发布
* 12.分支版本构建 选择 trunk ->  环境选择 勾选 正式环境 -> 从 表单中输入当前开发分支的版本号 -> 点击操作中的 构建
* 13.构建完后，勾选新增的版本分支，点击左下方的保存按钮
* 14.进入 发布单界面后 勾选 所有 机器， 然后点击发布所选

## git, svn 项目路径配置
在默认 config 正常情况下，git 目录与 svn 配置请按照以下进行：
```
|~ code.yy.com
|  |~ ent-FEteam
|  |  |+ commons                             # commons git, 前端通用库
|  |  |~ doc                                 # doc git, 用于放置项目的各种文档
|  |  |  |~ yy.com
|  |  |  |  |- README.md                     # yy.com git 分支版本信息
|  |  |  |  `- ...
|  |  |  `- ...
|  |  |+ yy.com                              # yy.com git 目录
`~ svn.yy.com
   `~ yy-music
      `~ web-dragon
         `~ star-fans
            `~ yyweb
               |~ branches
               |  |~ commit                  # svn commit 开发分支
               |  |  |+ static               # svn commit 开发分支 前端潜龙发布目录
               |  |  |  |+ jsp-tmpl          # jsp 静态资源
               |  |  |  `+ resource          # js, html, css, images 静态资源
               |  |  |~ yyweb-web
               |  |  |  |~ src
               |  |  |  |  |~ main
               |  |  |  |  |  |~ webapp      # svn commit 开发分支 后端潜龙发布目录
               |  |  |  |  |     |~ static   # js, html, css, images 静态资源
               |  |  |  |  |     `~ WEB-INF  # jsp 静态资源
               |  |  |  |  `- ...
               |  |  |  `- ...
               |  |  |- ...
               |  |~ develop                 # svn dev 开发分支
               |  |  |+ static               # svn dev 开发分支 前端潜龙发布目录
               |  |  |  |+ jsp-tmpl          # jsp 静态资源
               |  |  |  `+ resource          # js, html, css, images 静态资源
               |  |  |~ yyweb-web
               |  |  |  |~ src
               |  |  |  |  |~ main
               |  |  |  |  |  |~ webapp      # svn commit 开发分支 后端潜龙发布目录
               |  |  |  |  |     |~ static   # js, html, css, images 静态资源
               |  |  |  |  |     `~ WEB-INF  # jsp 静态资源
               |  |  |  |  `- ...
               |  |  |  `- ...
               |  |  |- ...
               `~ trunk                      # svn trunk 线上分支
                  |+ static                  # svn trunk 线上分支 前端潜龙发布目录
                  |  |+ jsp-tmpl             # jsp 静态资源
                  |  `+ resource             # js, html, css, images 静态资源
                  |~ yyweb-web
                  |  |~ src
                  |  |  |~ main
                  |  |  |  |~ webapp         # svn trunk 线上分支 后端潜龙发布目录
                  |  |  |     |~ static      # js, html, css, images 静态资源
                  |  |  |     `~ WEB-INF     # jsp 静态资源
                  |  |  `- ...
                  |  `- ...
                  `- ...
```

### log

#### 1.0.3 - 2016-11-07
更新内容
* [FIX] 修复 执行 p-videoshow-index/p-videoshow-index.js 这样带 '-' 的文件时不运行的问题

#### 1.0.2 - 2016-10-31
更新内容
* [EDIT] 将执行 gulp commit 时 清除旧版生成文件中，保留版本数 从 3 改为 5

#### 1.0.1 - 2016-10-26
更新内容
* [FIX] 修复在 mac 下 concat 命令生成的路径不正常问题

#### 1.0.0 - 2016.10.25
* [ADD] 诞生

