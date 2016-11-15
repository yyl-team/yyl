# 前端工作流设计方案

## 	1.	背景及现状  
随着前端开发复杂度的日益增加，各种优秀的组件框架也遍地开花。同时，我们面临业务规模的快速发展和工程师团队的不断扩张，如何解决资源整合、模块开发、项目部署、性能优化等问题势在必行。		
					
## 2.	目标  
根据背景和现状的分析，我们现制订一个规范化的前端工作流，很好地规范统一项目的模块化开发和前端资源，让代码的维护和互相协作更加容易更加方便，令前端开发自动化成为一种习惯。同时，让大家能够释放生产力，提高开发效率，更好更快地完成团队开发。

## 3.	技术路线  
**SVN**是一个开放源代码的版本控制系统，相较于RCS、CVS，它采用了分支管理系统，它的设计目标就是取代CVS。互联网上很多版本控制服务已从CVS迁移到Subversion。说得简单一点SVN就是用于多个人共同开发同一个项目，共用资源的目的。    

**GIT**是一款免费、开源的分布式版本控制系统，用于敏捷高效地处理任何或小或大的项目。它采用了分布式版本库的方式，不必服务器端软件支持，使源代码的发布和交流极其方便。    

**GULP**是前端开发过程中对代码进行构建的工具，是自动化项目的构建利器。它不仅能对网站资源进行优化，而且在开发过程中很多重复的任务能够使用各种工具自动完成，大大提高我们的工作效率。      

**WEBPACK**是当下最热门的前端资源模块化管理和打包工具。它可以将许多松散的模块按照依赖和规则打包成符合生产环境部署的前端资源。还可以将按需加载的模块进行代码分隔，等到实际需要的时候再异步加载。通过 loader 的转换，任何形式的资源都可以视作模块。    

**SASS**是一种CSS预处理器。它是对CSS的语法的一种扩充，它可以使用巢状、混入、选择子继承等功能，可以更有效有弹性的写出Stylesheet。Sass最后还是会编译出合法的CSS让浏览可以使用，也就是说它本身的语法并不太容易让浏览器识别（虽然它和CSS的语法非常的像，几乎一样），因为它不是标准的CSS格式，在它的语法内部可以使用动态变量等，所以它更像一种极简单的动态语言。  

**RequireJS** 是一个JavaScript模块加载器。它非常适合在浏览器中使用，但它也可以用在其他脚本环境, 就像 Rhino and Node. 使用RequireJS加载模块化脚本将提高代码的加载速度和质量。

**artTemplate**是新一代javascript模板引擎，它采用预编译方式让性能有了质的飞跃，并且充分利用javascript引擎特性，使得其性能无论在前端还是后端都有极其出色的表现。在chrome下渲染效率测试中分别是知名引擎Mustache与micro tmpl的25、32倍。  

**ReactJS**是Facebook推出的一个用来构建用户界面的JavaScript库。设计思想极其独特，属于革命性创新，性能出众，代码逻辑却非常简单。从最早的UI引擎变成了一整套前后端通吃的 Web App 解决方案。

**VueJS**是开源的一个前端开发库,通过简洁API提供高效的数据绑定和灵活的组件系统。


## 4.	业内标准
W3C标准

## 5.	总体设计
### 5.1.	工作流总体架构

![](http://i.imgur.com/J2JLgjO.png)  

### 5.2.	详细设计图
#### 5.2.1.	代码管理层  

SVN：属于集中化的版本控制系统，使用起来有点像是档案仓库的感觉，支持并行读写文件，支持代码的版本化管理，功能包括取出、导入、更新、分支、改名、还原、合并等等。使用比较简单，这里不再赘述。

GIT：是分布式的版本控制系统。它采用了分布式版本库的方式，不必服务器端软件支持。操作命令包括：clone，pull，push,branch ,merge ,push,rebase等等，具体使用我也不赘述。

SVN和GIT的使用：SVN适用于项目管理。因为它简单易用。当代码涉及多组成员或者代码有一定的秘密性，用svn管理都是省事放心。

Git适用于代码管理。对于组内的一些公用组件，或者sdk之类的代码，用git更好管理，更新更快。

#### 5.2.2.	Images层
![](http://i.imgur.com/3vuK5mJ.png)

(1).图片可以按页面和公共模块来分着存放。  
(2).一个页面独有的图片用一个文件夹存放，方便压缩和合成雪碧图。     
(3).公用的图片元素或者出现多次的图片元素存放到public文件夹。  
(4).pic文件夹用于存放静态页面时的demo图片，上正式环境的时候，这个文件里的东西可以清除。  


格式使用：  
**GIF**  
GIF是一种正在逐渐被抛弃的图片格式。PNG格式的出现就是为了替代它。PNG 8除了不支持动画外，PNG8有GIF所有的特点，但是比GIF更加具有优势的是它支持alpha透明和更优的压缩（GIF仅支持索引透明）。  
但是，当图片颜色简单到一定程度，大小小到一定程度的时候，gif格式图片大小要小于png8。  

**JPG**  
支持摄影图像或写实图像的高级压缩，并且可利用压缩比例控制图像文件大小。  
有损压缩会使图像数据质量下降，并且在编辑和重新保存JPG格式图像时，这种下降损失会累积。  
JPG和PNG8都适合颜色较少的图片，因为JPG在栅格化时精确记录少数点，其它点用差值补齐。但是当图像颜色数少于一定值比如256的时候，PNG8可能更合适。  
JPG不适合具有大块颜色相近的区域或亮度("锐度")差异十分明显的较简单的图片。  
JPG在存储摄影或写实图像一般能达到最佳的压缩效果，比如网站的背景图，轮播图，用户头像等等。  


**PNG**  
PNG可以细分为三种格式:PNG8，PNG24，PNG32。  
后面的数字代表这种PNG格式最多可以索引和存储的颜色值。”8″代表2的8次方也就是256色，而24则代表2的24次方大概有1600多万色。  
能在保证最不失真的情况下尽可能压缩图像文件的大小。  
PNG用来存储灰度图像时，灰度图像的深度可多到16位，存储彩色图像时，彩色图像的深度可多到48位，并且还可存储多到16位的α通道数据。  
对于需要高保真的较复杂的图像，PNG虽然能无损压缩，但图片文件较大，不适合应用在Web页面上。  


**使用规则：**  
1、少用图片元素，尽量用css3代替。  
2、尽量少用png24格式，要半透明的除外。  
3、JPG适合摄影图像或写实图像，同时也适合颜色较少图像。  
4、PNG8 适合所含颜色很少(少于256)、具有大块颜色相近的区域或亮度差异十分明显的较简单的图片。  
5、PNG24适合图片较为复杂且有透明效果且透明效果无法用css来实现的情况。  
6、如果页面中有较多的小icon，首先考虑使用webfont,如果webfont不能满足需求，必须使用css sprite将图片合并，来压缩总体图片的大小，同时减少页面请求提高访问速度。参考见[webfont字库](http://www.youziku.com)  
7、小于8k的图片请转化为base64。  



### 5.2.3.	CSS层
![](http://i.imgur.com/JnxKRfM.png)

css层通过sass来管理，这样能更加灵活，方便和容易维护。具体规范参考[css规范](http://git.yypm.com/YYLive/styleGuide/blob/master/css-guide.md)。
使用规则：
1、Include文件夹用来存放公共模块，reset或者重用性很高的mixin等等全局公用的样式。
2、Components文件夹用来存放组件级别的公用样式，例如公用的按钮样式，icon样式，弹窗的样式等等。
3、css命名最好就语义化。

### 5.2.4.	HTML层  

HTML层主要就是版本号的控制，这个放在下面GULP的使用时介绍。html的规范参考[HTML规范](http://git.yypm.com/YYLive/styleGuide/blob/master/html-guide.md)。

### 5.2.5.	JS层  

[js规范点击这里](http://git.yypm.com/YYLive/styleGuide/blob/master/javascript-guide.md)  

#### 5.2.5.1.	JS模块化标准--RequireJS  

通过使用大家熟悉的AMD规范，能统一大家的js标准。模块化的开发更方便代码的共享和按需加载，提高开发的效率。借助RequireJS可以实现js文件的异步加载，管理模块之间的依赖性，便于代码的编写和维护。 
**RequireJS使用原则：**  
![](http://i.imgur.com/NiN0DmR.png)

新项目可以采取这个模板为基础去扩展代码。都在同一个区域定义变量，都在同一个区域定义事件，都在同一个地方绑定事件，最后初始化和暴露方法。套用代码标准模板可以做到大家的代码风格类似，以后接手的同学一看就知道代码在哪里，快速上手。

#### 5.2.5.2.	JS模板引擎--artTemplate  
artTemplate这个模板引擎相对成熟，性能比较好。支持运行时调试，可精确定位异常模板所在语句，模板语句简洁，浏览器支持完整。 
**artTemplate的使用规则：**  
按照它的api来使用即可。  
![](http://i.imgur.com/2NiYyyO.png)  

![](http://i.imgur.com/vIs8qNU.png)  

#### 5.2.5.3.	MVVM和类MVC框架  
##### 5.2.5.3.1.	ReactJS  
ReactJS是一个用来构建用户界面的 JavaScript 库，虚拟DOM的使用让它的性能优越。同时，它实现了单向响应的数据流，从而减少了重复代码，这也是它为什么比传统数据绑定更简单的原因。  
鉴于ReactJS对IE的支持不足，所以比较适合使用到移动端的项目中去。  
接下来介绍ReactJS的基本使用。
###### 5.2.5.3.1.1.	HTML模板
![](http://i.imgur.com/kebZ6LX.png)

###### 5.2.5.3.1.2.	ReactDOM.render()  
ReactDOM.render 是 React 的最基本方法，用于将模板转为 HTML 语言，并插入指定的 DOM 节点。  
![](http://i.imgur.com/YMsLChV.png)  

###### 5.2.5.3.1.3.	JSX 语法  
JSX的语法就是直接写在 JavaScript 语言之中，不加任何引号。它允许 HTML 与 JavaScript 的混写，简单方便。 
![](http://i.imgur.com/yA9vfAy.png)  

###### 5.2.5.3.1.4.	封装组件  
React 允许将代码封装成组件，然后像插入普通 HTML 标签一样，在网页中插入这个组件。React.createClass 方法就用于生成一个组件类的。

![](http://i.imgur.com/jH7mhQx.png)  
![](http://i.imgur.com/fmwMGwo.png)  

###### 5.2.5.3.1.5.	PropTypes 属性  
PropTypes属性，是用来验证组件实例的属性是否符合要求的一个利器。
![](http://i.imgur.com/hTwIoU3.png)  
Mytitle组件有一个title属性。PropTypes 告诉 React，这个 title 属性是必须的，而且它的值必须是字符串。如果实例化过程中，title不是字符串就会验证不通过，出现后台报错的信息。  

###### 5.2.5.3.1.6.	this.state  
React 的一大创新，就是将组件看成是一个状态机，一开始有一个初始状态，然后用户互动，导致状态变化，从而触发重新渲染UI 。state就是状态的存取对象。  
![](http://i.imgur.com/JFiF9cw.png)  
截图的例子中，getInitialState 方法用于定义初始状态，这个对象可以通过 this.state 属性读取。当用户点击组件，导致状态变化，this.setState 方法就修改状态值，每次修改以后，自动调用 this.render 方法，再次渲染组件。  

##### 5.2.5.3.2.	VueJS  
VueJs是一个短小精悍容易上手的MVVM框架。Api清晰，使用容易。支持ie8以上等其他主流的浏览器。适合在移动端和浏览器要求偏弱的项目。
VueJs的基本使用：

###### 5.2.5.3.2.1.	数据绑定  
![](http://i.imgur.com/xHBzyeU.png)  

###### 5.2.5.3.2.2.	双向绑定  
![](http://i.imgur.com/G4UOjsP.png)  

###### 5.2.5.3.2.3.	渲染列表  
![](http://i.imgur.com/xZTrEPT.png)

### 5.2.6.	自动化构建工具  
#### 5.2.6.1.	GULP  
GULP简单易用，是前端自动化项目的构建利器。能把很多繁琐重复的工作简单化，命令化。作为前端工作流的利器，是一个不错的选择。加上丰富的组件，让它能干更多自动化的事情。

##### 5.2.6.1.1.	GULP的使用  
1、全局安装 
![](http://i.imgur.com/zZVY8Sc.png)   
2、在项目根目录下创建一个名为 gulpfile.js 的文件  
![](http://i.imgur.com/8lAtKX9.png)  
3、运行 gulp  
![](http://i.imgur.com/AQ8VGpd.png)  
具体的语法请参考官网。  

##### 5.2.6.1.2.	GULP的插件使用  

###### 5.2.6.1.2.1.	合并css-- gulp-concat-css  
![](http://i.imgur.com/7qz1c7n.png)  

###### 5.2.6.1.2.2.	合并js-- gulp-concat  
![](http://i.imgur.com/PE28BQj.png)

###### 5.2.6.1.2.3.	压缩混淆js--gulp-uglify  
![](http://i.imgur.com/vVNNMoI.png)  

###### 5.2.6.1.2.4.	压缩css-- gulp-minify-css/gulp-clean-css  
![](http://i.imgur.com/06OIsMn.png)  

###### 5.2.6.1.2.5.	监听文件的更新-- gulp-livereload  
![](http://i.imgur.com/UnXGY4v.png)  
这个例子是监听样式的更新。

###### 5.2.6.1.2.6.	图片压缩-- gulp-imagemin  
![](http://i.imgur.com/28ztcB6.png)  

###### 5.2.6.1.2.7.	生成雪碧图-- gulp.spritesmith  
![](http://i.imgur.com/BWgAiO0.png)  
Sprite.css是雪碧图生成的css。  

###### 5.2.6.1.2.8.	版本号的控制-- gulp-rev-append  
gulp-rev-append 插件会通过正则(?:href|src)=”(.*)[?]rev=(.*)[“]查找并给指定链接填加版本号，默认根据文件MD5生成，因此文件未发生改变，这个版本号将不会改变。
![](http://i.imgur.com/Qugxz6N.png)  
运行后的结果：
![](http://i.imgur.com/5lYXbyT.png)  

###### 5.2.6.1.2.9.	编译sass-- gulp-sass  
![](http://i.imgur.com/qjJwhkr.png)  

还有其他很多插件不再一一介绍。

#### 5.2.6.2.	Webpack  
![](http://i.imgur.com/wXeV2Mf.png)  

**webpack**是近期最火的一款模块加载器兼打包工具。
**webpack**是以 commonJS 的形式来书写脚本滴，但对 AMD/CMD 的支持也很全面，方便旧项目进行代码迁移。
开发便捷，能替代部分 grunt/gulp 的工作，比如打包、压缩混淆、图片转base64等。
扩展性强，插件机制完善，特别是支持 React 热插拔的功能让人眼前一亮。
下面简单介绍Webpack的基本使用。

##### 5.2.6.2.1.	全局安装  
![](http://i.imgur.com/q3qEayM.png)  

##### 5.2.6.2.2.	简单使用
![](http://i.imgur.com/Jtpu34c.png)  
![](http://i.imgur.com/KYSulpo.png) 

运行：
![](http://i.imgur.com/cEF4S9o.png)
这样就会编译entry.js并打包到bundle.js。

##### 5.2.6.2.3.	Loader  

Webpack 本身只能处理 JavaScript 模块，如果要处理其他类型的文件，就需要使用 loader 进行转换。
**Loader**可以理解为是模块和资源的转换器，它本身是一个函数，接受源文件作为参数，返回转换的结果。这样，我们就可以通过 require 来加载任何类型的模块或文件，比如 CoffeeScript、 JSX、 SASS 或图片。

![](http://i.imgur.com/nQK6t7y.png)  

module.loaders 告知 webpack 每一种文件都需要使用什么加载器来处理。

##### 5.2.6.2.4.	GULP和Webpack的混合使用  
![](http://i.imgur.com/1huTigL.png)  

在gulp里面，只需把配置写到webpack({ ... }) 中去即可，不用再写 webpack.config.js 。  

##### 5.2.6.2.5.	在ReactJS里面使用Webpack  
在ReactJS里面安装react-hot-loader，再结合Webpack就可以实现修改即更新同步的效果。  

## 6.	技术亮点  
### 6.1.	统一标准，提高工作效率，有利团队合作  
借鉴业内出名的诸如RequireJS、SASS等框架，统一前端代码的规范，有利于以后的团队合作，使用GULP、Webpack等高效的构建工具，能提高工作的效率，减少工作量。更有利于代码的维护和可扩展性。  

### 6.2.	跨平台，支持灵活多变的场景  
模块化的设计和可扩展的代码模式，加上灵活的自动化构建工具，适合各种场景的开发。也便于新成员的接入。


