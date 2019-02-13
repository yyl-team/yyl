
# webpack


## 业务信息
* 产品负责人: `请手动填写`
* 设计负责人: `请手动填写`
* 后端负责人: `请手动填写`


## 环境信息
### host
```
# 测试环境 hsot
14.17.108.184 www.yy.com
14.17.108.184 yyweb.yystatic.com

183.36.117.141 web.yy.com
183.36.117.141 web.yystatic.com
183.36.117.141 web1.yystatic.com
183.36.117.141 web2.yystatic.com
183.36.117.141 web3.yystatic.com
```

### 访问地址
* 正式环境 [http://web.yy.com/webpack](http://web.yy.com/webpack)
* 正式环境 [http://www.yy.com/web/webpack](http://www.yy.com/web/webpack)
* 测试环境 [http://webtest.yy.com/webpack](http://webtest.yy.com/webpack)

### git 地址
* [https://git.yy.com/webs/web_static/webpack](https://git.yy.com/webs/web_static/webpack)

### 潜龙入口
* [http://bigdragon.yy.com/admin/dragon/project/list.jsp?projId=314115](http://bigdragon.yy.com/admin/dragon/project/list.jsp?projId=314115)


## 构建信息
本项目使用 `yyl` 进行构建

### 安装 yyl
```
npm install yyl -g
```

### 相关命令
```
# 本地构建
yyl watch --proxy

# 远程映射
yyl watch --proxy --remote

# 打包
yyl all --isCommit
```
