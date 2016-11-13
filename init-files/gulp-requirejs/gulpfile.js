'use strict';
/*!
 * gulpfile.js for yym-FETeam
 *
 * @author: jackness Lau
 */



var gulp = require('gulp'),
    fs = require('fs'),
    http = require('http'),
    path = require('path'),
    querystring = require('querystring'),
    sass = require('gulp-ruby-sass'), // sass compiler
    //sass = require('gulp-sass'), // sass compiler
    minifycss = require('gulp-minify-css'), // minify css files
    jshint = require('gulp-jshint'), // check js syntac
    uglify = require('gulp-uglify'), // uglify js files
    imagemin = require('gulp-imagemin'), // minify images
    rename = require('gulp-rename'), // rename the files
    concat = require('gulp-concat'), // concat the files into single file
    notify = require('gulp-notify'), // notify the msg during running tasks
    replacePath = require('gulp-replace-path'), // replace the assets path
    requirejsOptimize = require('gulp-requirejs-optimize'), // requirejs optimizer which can combine all modules into the main js file
    inlinesource = require('gulp-inline-source'), // requirejs optimizer which can combine all modules into the main js file
    filter = require('gulp-filter'), // filter the specified file(s) in file stream
    gulpJade = require('gulp-jade'),
    livereload = require('gulp-livereload'),
    through = require('through2'),
    plumber = require('gulp-plumber'),
    runSequence = require('run-sequence').use(gulp),
    es = require('event-stream'),
    prettify = require('gulp-prettify'),
    rev = require('gulp-rev'),
    clean = require('gulp-clean'),
    server = require('gulp-devserver'),
    remoteRevData,
    localRevData;

require('colors');

var config = require('./config.js'),
    localConfig = fs.existsSync('./config.mine.js')? require('./config.mine.js'): {};



var fn = {
    blankPipe: function(){
        return through.obj(function(file, enc, next){next(null, file);});
    },
    get: function(url){
		var myfn, 
			myQuery,
			myProxy;

		if(typeof arguments[1] == 'function'){
			myfn = arguments[1];
			myProxy = arguments[2];
			myQuery = {};
		} else if(typeof arguments[1] == 'object'){
			myQuery = arguments[1];
			myfn = arguments[2];
			myProxy = arguments[3];
		}
		var queryData = require('querystring').stringify(myQuery),
			urlAcc = require('url').parse(url),
			opt = {
                host: urlAcc.hostname,
                port: urlAcc.port || 80,
                path: urlAcc.pathname +  urlAcc.search,
				method:'GET',
				headers:{
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:24.0) Gecko/20100101 Firefox/24.0',
					"Content-Type": 'application/x-www-form-urlencoded',  
					"Content-Length": queryData.length 
                }
            };

		if(myProxy && myProxy.port && myProxy.host){
			opt.host = myProxy.host;
			opt.port = myProxy.port;
			opt.path = url;

		} else {
			opt.host = urlAcc.host;
			opt.port = urlAcc.port;
			opt.path = urlAcc.path;
			
		}
		var myReq = http.request(opt, function(result){
			var chunks = [],
				size = 0;

			result.on('data', function(chunk){
				size += chunk.length;
				chunks.push(chunk);
			});

			result.on('end', function(){
				var myBuffer = Buffer.concat(chunks, size);

                if(myfn){
                    myfn(myBuffer);
                }
			});
		});
		myReq.write('');
		myReq.end();
	},
    /**
     * 运行 cmd
     * @param  {String|Array} str           cmd执行语句 or 数组
     * @param  {funciton}     callback      回调函数
     *                        - json.status 状态码 1:成功, 0:失败
     *                        - json.error  错误信息
     * @return {Void}
     */
    runCMD: function(str, callback, path, showOutput){
        var myCmd = require('child_process').exec,
            r = {
                status:0,
                error:''
            },
            child;

        if(showOutput === undefined){
            showOutput = true;
        }
        if (!str) {
            r.error = '没任何 cmd 操作';
            return callback(r);
            
        }
        if (!/Array/.test(Object.prototype.toString.call(str))) {
            str = [str];
        }

        child = myCmd(str.join(" && "),{
            maxBuffer: 2000 * 1024,
            cwd: path || ''
        }, function(err){
            if(err){
                // r.error = err.stack.replace(/(\r|\n|\t)+/g,';').replace(/\s+/g,' ').replace(/:[^;:]+;/g,':');
                if(showOutput){
                    console.log('cmd运行 出错');
                    console.log(err.stack);
                }
                r.error = 'cmd运行 出错';
                return callback(r);
                
            } else {
                r.status = 1;
                return callback(r);
            }

        });
        child.stdout.setEncoding('utf8');
        
        if(showOutput){
            child.stdout.pipe(process.stdout);
            child.stderr.pipe(process.stderr);
        }
        
    },
    
    /**
     * 删除文本
     * ------------
     * 单个文本方法
     * -------------
     * @param  {String}   path
     * @param  {function} callback
     * @param  {RegExp}   filters
     *
     * --------------
     * 多个目录/文件方法
     * --------------
     * @param  {Array}    list
     * @param  {function} callback 回调方法
     * @param  {RegExp}   filters  忽略文件用 滤镜，选填参数
     *
     * @return {Void}
     */
    removeFiles: function(list, callback, filters){///{
        if(!fn.isArray(list)){
            list = [list];
        }
        
        var rmFile = function(file, filters){
                if(!fs.existsSync(file) || (filters && filters.test(file))){
                    return;
                }
                try{
                    fs.unlinkSync(file);
                } catch(er){}

            },
            rmPath = function(iPath, filters){
                var list = fs.readdirSync(iPath);

                list.forEach(function(item){
                    var file = path.join(iPath, item);
                   
                    if(filters && filters.test(file)){

                    } else {
                        var stat = fs.statSync(file);
                            
                        if(stat.isDirectory()){
                            rmPath(file, filters);
                            try{
                                fs.rmdirSync(file);
                            } catch(er){}

                        } else {
                            rmFile(file);
                        }
                    }
                });
            };

        list.forEach(function(item){
            if(!item || !fs.existsSync(item)){
                return;
            }

            var stat = fs.statSync(item);
            if(stat.isDirectory()){
                rmPath(item, filters);
            } else {
                rmFile(item, filters);
            }
            
        });
        if(callback){
            callback();
        }
    },///}


    /**
     * 判断是否数组
     * @param  {Anything}  需要判断的对象
     * @return {Boolean}  是否数组
     */
    isArray: function(arr){
        return /Array/.test(Object.prototype.toString.call(arr));
    },

    Promise: function(fn){
        var she = this;
        
        she.queue = [];
        she.current = 0;
        she.then = function(fn){
            if(typeof fn == 'function'){
                she.queue.push(fn);
            }
            return she;
        };
        she.start = function(){
            var myArgv = Array.prototype.slice.call(arguments);
            she.resolve.apply(she, myArgv);
        };

        she.resolve = function(){
            var myArgv = Array.prototype.slice.call(arguments);
            
            myArgv.push(she.resolve);
            if(she.current){
                myArgv.push(she.queue[she.current - 1]);
            }

            if(she.current != she.queue.length){
                she.queue[she.current++].apply(she, myArgv);
            }
        };
        if(fn){
            she.then(fn);
        }

        
    },
    /**
     * 判断对象类别
     * @param {Anything} 对象
     * @return {string}  类型
     */
    type: function (obj) {
        var type,
            toString = Object.prototype.toString;
        if (obj === null) {
            type = String(obj);
        } else {
            type = toString.call(obj).toLowerCase();
            type = type.substring(8, type.length - 1);
        }
        return type;
    },

    isPlainObject: function (obj) {
        var she = this,
            key,
            hasOwn = Object.prototype.hasOwnProperty;

        if (!obj || she.type(obj) !== 'object') {
            return false;
        }

        if (obj.constructor &&
            !hasOwn.call(obj, 'constructor') &&
            !hasOwn.call(obj.constructor.prototype, 'isPrototypeOf')) {
            return false;
        }

        for (key in obj) {}
        return key === undefined || hasOwn.call(obj, key);
    },

    /**
     * 扩展方法(来自 jQuery)
     * extend([deep,] target, obj1 [, objN])
     * @base she.isPlainObject
     */
    extend: function () {
        var she = this,
            options, name, src, copy, copyIsArray, clone,
            target = arguments[0] || {},
            i = 1,
            length = arguments.length,
            deep = false;

        // Handle a deep copy situation
        if (typeof target === 'boolean') {
            deep = target;
            target = arguments[1] || {};
            // skip the boolean and the target
            i = 2;
        }

        // Handle case when target is a string or something (possible in deep copy)
        if (typeof target !== 'object' && she.type(target) !== 'function') {
            target = {};
        }

        // extend caller itself if only one argument is passed
        if (length === i) {
            target = this;
            --i;
        }

        for (; i<length; i++) {
            // Only deal with non-null/undefined values
            if ((options = arguments[i]) !== null) {
                // Extend the base object
                for (name in options) {
                    src = target[name];
                    copy = options[name];

                    // Prevent never-ending loop
                    if (target === copy) {
                        continue;
                    }

                    // Recurse if we're merging plain objects or arrays
                    if (deep && copy && (she.isPlainObject(copy) || (copyIsArray = she.type(copy) === 'array'))) {
                        if (copyIsArray) {
                            copyIsArray = false;
                            clone = src && she.type(src) === 'array' ? src : [];
                        } else {
                            clone = src && she.isPlainObject(src) ? src : {};
                        }

                        // Never move original objects, clone them
                        target[name] = she.extend(deep, clone, copy);

                    // Don't bring in undefined values
                    } else if (copy !== undefined) {
                        target[name] = copy;
                    }
                }
            }
        }

        // Return the modified object
        return target;
    }
};
path.joinFormat = function(){
    var iArgv = Array.prototype.slice.call(arguments);
    var r = path.join.apply(path, iArgv);
    return r
        .replace(/\\+/g, '/')
        .replace(/(^http[s]?:)[\/]+/g, '$1//');
};

config = fn.extend(true, config, localConfig);


gulp.task('--help', function(){
    console.log([
        '',
        '',
        '  Ustage:'.yellow + ' gulp <command> --name <project>',
        '',
        '',
        '  Commands:'.yellow,
        '    ' + 'init'.gray + '                  init project',
        '    ' + 'watchAll'.gray + '              optimize & wath the target',
        '    ' + 'all'.gray + '                   optimize the target',
        '    ' + 'js'.gray + '                    optimize the project js file',
        '    ' + 'css'.gray + '                   optimize the project sass file',
        '    ' + 'html'.gray + '                  optimize the project jade file',
        '    ' + 'copy'.gray + '                  copy the project to dev & test Path',
        '    ' + 'commit --sub <branch>'.gray + ' commit the project to dev & test Path',
        '',
        '',
        '  Project:'.yellow,
        '    ' + 'pc'.gray + '                    web site',
        '    ' + 'mobile'.gray + '                mobile site',
        '',
        '',
        '  Branch:'.yellow,
        '    ' + 'dev'.gray + '                   branch dev',
        '    ' + 'commit'.gray + '                branch commit',
        '    ' + 'trunk'.gray + '                 branch trunk',
        '',
        '',
        '  Options:'.yellow,
        '    ' + '-h, --help'.gray + '            output usage information',
        '',
        ''
    ].join('\n'));
});

gulp.task('default', function(){
    gulp.run('--help');
});

gulp.task('-h', function(){
    gulp.run('--help');
});



// 初始化目录
gulp.task('init', function(){

    //..
    // init project
});

function ctxRender(ctx){
    var vars = gulp.env.vars;
    if(vars){
        for(var key in vars){
            if(vars.hasOwnProperty(key)){
                ctx = ctx.replace(new RegExp('\\{\\$'+ key +'\\}', 'g'), vars[key]);
            }
        }
    }
    return ctx;

}

function taskHelper(commands){
    var dirs = [];
    var output;
    if(!config.src){
        for(var key in config){
            if(config.hasOwnProperty(key)){
                dirs.push(key);
            }
        }

        output = [
            '',
            '',
            '  Ustage:'.yellow,
            '  gulp '+ commands +' --name <Project>',
            '',
            '  Project:'.yellow,
            (function(){
                var r = [];
                dirs.forEach(function(item){
                    r.push('  ' + item.gray);
                });
                return r.join('\n');

            }()),
            '',
            ''
        ];
    } else {
        output = [
            '',
            '',
            '  Ustage:'.yellow,
            '  gulp '+ commands +' not work',
            ''
        ];

    }

    
    console.log(output.join('\n'));
}

/**
 * task 执行前初始化函数
 */
function taskInit(){
    process.chdir(__dirname);

    var 
        commands = process.argv[2],
        iConfig;

    if(gulp.env.ver){
        gulp.env.version = gulp.env.ver;
    }

    if(gulp.env.sub){
        gulp.env.subname = gulp.env.sub;

    }
    if(gulp.env.name){
        iConfig = config[gulp.env.name];

    } else {
        iConfig = config;

    }


    var isCommit = gulp.env.isCommit;

    if(!iConfig || !iConfig.src){
        taskHelper(commands);
        process.exit();
        return;

    } else {
        if(!gulp.env.hasInit && gulp.env.version){
            // config[iProject].src = path.joinFormat(config[iProject].src, gulp.env.version);
            gulp.env.hasInit = true;
        }
        if(isCommit){
           iConfig.isCommit = true;

            if(gulp.env.subname){
                gulp.env.vars = {
                    PATH: iConfig.svn.path[gulp.env.subname],
                    PATH2: iConfig.svn.path2? iConfig.svn.path2[gulp.env.subname]: undefined,
                    SRC: iConfig.src
                };
            }

        } else {
            iConfig.isCommit = false;
        }
        

        return iConfig;
    }
}

gulp.task('js', function (done) {
    gulp.env.nowTask = 'js';
    runSequence('js-task', 'concat', 'rev-update', done);
});
gulp.task('js-task', function () {
    var iConfig = taskInit();
    if(!iConfig){
        return;
    }

    /* requirejs 主模块列表 & 页面js [start] */
    var rjsFilter = filter(function (file) {
            var result = /([pj]\-[a-zA-Z0-9_-]*)[\\\/]([pj]\-[a-zA-Z0-9-_]*)\.js$/.test(file.path);
            if(result){
                file.base = path.joinFormat(file.path.replace(/([pj]\-[a-zA-Z0-9_-]*)\.js$/, ''));
            }
            return result;
        });
    /* requirejs 主模块列表 & 页面js [end] */

        // jsTask
        var jsStream = gulp.src(path.join(__dirname, iConfig.src, 'components/**/*.js'))
            .pipe(plumber())
            .pipe(jshint.reporter('default'))
            .pipe(rjsFilter)
            .pipe(jshint())
            /* 合并主文件中通过 requirejs 引入的模块 [start] */
            .pipe(requirejsOptimize({
                optimize: 'none',
                mainConfigFile: path.joinFormat(__dirname, iConfig.src, 'js/rConfig/rConfig.js')
            }))
            // .pipe(iConfig.isCommit? uglify(): through.obj(function(file, enc, next){next();}))
            .pipe(iConfig.isCommit?uglify(): fn.blankPipe())
            .pipe(rename(function(path){
                path.basename = path.basename.replace(/^[pj]-/g,'');
                path.dirname = '';
            }))
            .pipe(gulp.dest(path.joinFormat(__dirname, 'dist', iConfig.dest.path.js)))
            // .pipe(notify({ message: 'JS task complete' }))
            .pipe(livereload({quiet: true}));

        // js lib Task
        var jsLibStream = gulp.src(path.joinFormat(__dirname, iConfig.src, 'js/lib/**/*.js'))
            .pipe(plumber())
            .pipe(iConfig.isCommit?uglify():fn.blankPipe())
            .pipe(gulp.dest(path.joinFormat('dist', iConfig.dest.path.jsLib)));

    return es.concat.apply(es, [jsStream, jsLibStream]);
});

gulp.task('html', function(done){
    gulp.env.nowTask = 'html';
    runSequence('html-task', 'rev-update', done);
});
gulp.task('html-task', function(){
    var iConfig = taskInit();
    if(!iConfig){
        return;
    }

    var 
        events = [],
        // tmpl task
        tmplStream = gulp.src( path.joinFormat(__dirname, iConfig.src, 'components/@(p-)*/*.jade'))
            .pipe(plumber())
            .pipe(gulpJade({
                pretty: true,
                client: false
            }))
            .pipe(through.obj(function(file, enc, next){
                var iCnt = file.contents.toString();
                var pathReg = /(src|href|data-main|data-original)\s*=\s*(['"])([^'"]*)(["'])/ig;
                // script 匹配
                var scriptReg = /(<script[^>]*>)([\w\W]*?)(<\/script\>)/ig;
                var dirname = path.joinFormat(__dirname, iConfig.src, 'html');
                iCnt = iCnt
                    // 隔离 script 内容
                    .replace(scriptReg, function(str, $1, $2, $3){
                        return $1 + querystring.escape($2) + $3;
                    })
                    .replace(pathReg, function(str, $1, $2, $3, $4){
                        var iPath = $3,
                            rPath = '';

                        if(iPath.match(/^(data:image|javascript:|#|http:|https:|\/)/) || !iPath){
                            return str;
                        }


                        var fDirname = path.dirname(path.relative(dirname, file.path));
                        rPath = path.joinFormat(fDirname, iPath)
                            .replace(/\\+/g,'/')
                            .replace(/\/+/, '/')
                            ;

                        return $1 + '=' + $2 + rPath + $4;
                    })
                    // 取消隔离 script 内容
                    .replace(scriptReg, function(str, $1, $2, $3){
                        return $1 + querystring.unescape($2) + $3;
                    });

                file.contents = new Buffer(iCnt, 'utf-8');
                this.push(file);
                next();
            }))
            .pipe(rename(function(path){
                path.basename = path.basename.replace(/^p-/g,'');
                path.dirname = '';
            }))
            .pipe(prettify({indent_size: 4}))
            .pipe(gulp.dest(path.joinFormat(__dirname, iConfig.src, 'html')));

    events.push(tmplStream);

    // if(iConfig.isCommit){
        // html task
        var htmlStream = gulp.src( path.joinFormat(__dirname, iConfig.src, 'html/*.html'))
            .pipe(plumber())
            .pipe(inlinesource())
            // 删除requirejs的配置文件引用
            .pipe(replacePath(/<script [^<]*local-usage\><\/script>/g, ''))

            // 替换全局 图片
            .pipe(replacePath(
                path.joinFormat(
                    path.relative(
                        path.join(__dirname, iConfig.src, 'html'),
                        path.join(__dirname, iConfig.global.components)
                    )
                ),
                path.joinFormat(iConfig.dest.hostname, iConfig.dest.path.images, 'globalcomponents')
            ))
            .pipe(replacePath('../js/lib', path.joinFormat(iConfig.dest.hostname, iConfig.dest.path.jsLib)))
            .pipe(replacePath('../js', path.joinFormat(iConfig.dest.hostname, iConfig.dest.path.js)))
            .pipe(replacePath(/\.\.\/components\/p-\w+\/p-(\w+).js/g, path.joinFormat(iConfig.dest.hostname, iConfig.dest.path.js, '/$1.js')))

            .pipe(replacePath('../css', path.joinFormat(iConfig.dest.hostname, iConfig.dest.path.css)))

            .pipe(replacePath('../images', path.joinFormat(iConfig.dest.hostname, iConfig.dest.path.images)))
            .pipe(replacePath(/\.\.\/(components\/[pw]-\w+\/images)/g, path.joinFormat(iConfig.dest.hostname, iConfig.dest.path.images, '$1')))

            // 全局 lib
            .pipe(replacePath(
                path.joinFormat(
                    path.relative(path.join(__dirname, iConfig.src, 'html'), __dirname),
                    iConfig.global.lib
                ), 
                path.joinFormat(iConfig.dest.hostname, iConfig.dest.path.globallib)
            ))
            
            // 全局 component
            // .pipe(replacePath(
            //     path.joinFormat(
            //         path.relative(path.join(__dirname, iconfig.src, 'html'), __dirname),
            //         iconfig.global.components
            //     ), 
            //     path.joinFormat(iConfig.dest.hostname, iConfig.dest.path.globalcomponents)
            // )
            // .pipe(replacePath('../images', + assetsPath.images))
            .pipe(gulp.dest( path.joinFormat(__dirname, 'dist', iConfig.dest.path.html )))
            .pipe(livereload({quiet: true}));

        events.push(htmlStream);
    // }

    return es.concat.apply(es, events);
});



gulp.task('rev', function(done){
    runSequence('rev-clean', 'rev-loadRemote', 'rev-build', 'rev-remote-build', 'rev-dataInit', 'rev-replace', done);
});

gulp.task('rev-clean', function(){
    var 
        iConfig = taskInit(),
        md5Filter = filter(function(file){
            return /-[a-zA-Z0-9]{10}\.?\w*\.\w+/.test(file.history);

        }, {restore: true});

    if(!iConfig){
        return;
    }
     
    return gulp.src( path.joinFormat(__dirname, 'dist', iConfig.dest.path.root, '**/*.*'), { base: path.joinFormat(__dirname, 'dist') })
            .pipe(plumber())
            .pipe(md5Filter)
            .pipe(clean({force: true}));
});

gulp.task('rev-loadRemote', function(done){
    var 
        iConfig = taskInit();

    if(!iConfig){
        return;
    }

    var
        iVer = gulp.env.version,
        revAddr;

    if(!iVer){
        console.log('rev-loadRemote finish, no version'.yellow);
        return done();

    } else if(!iConfig.dest.revAddr){
        console.log('rev-loadRemote finish, no config.dest.revAddr'.yellow);
        return done();

    } else {
        if(iVer == 'remote'){
            revAddr = iConfig.dest.revAddr + '?' + (+new Date());

        } else {
            revAddr = iConfig.dest.revAddr.split('.json').join('-' + iVer + '.json');
        }

        fn.get(revAddr, function(data){
            try{
                remoteRevData = JSON.parse(data);
                console.log('rev get!'.green);

            } catch(er){
                console.log('rev get fail'.red);
            }

            done();
        });
    }
});

gulp.task('rev-build', function(){
    var 
        iConfig = taskInit();

    if(!iConfig){
        return;
    }
    var 
        
        now = new Date(),
        addZero = function(num) {
            return num < 10 ? '0' + num : '' + num;
        };

    gulp.env.cssjsdate = now.getFullYear() + addZero(now.getMonth() + 1) + addZero(now.getDate()) + addZero(now.getHours()) + addZero(now.getMinutes()) + addZero(now.getSeconds());

    return gulp.src( [
            path.joinFormat(__dirname, 'dist', iConfig.dest.path.root, '**/*.*'), 
                '!**/*.html', 
                '!**/assets/**/*.*'
            ], { 
                base: path.joinFormat(__dirname, 'dist') 
            })
            .pipe(rev())
            
            .pipe(gulp.dest(path.joinFormat(__dirname, 'dist')))
            .pipe(rev.manifest())
            .pipe(through.obj(function(file, enc, next){
                var iCnt = file.contents.toString();
                try{
                    var 
                        iJson = JSON.parse(iCnt);
                    iJson.version = gulp.env.cssjsdate;
                    iCnt = JSON.stringify(iJson, null, 4);
                } catch(er){}

                file.contents = new Buffer(iCnt, 'utf-8');
                this.push(file);
                next();
            }))
            .pipe(gulp.dest(path.joinFormat(__dirname, 'dist', iConfig.dest.path.assets)))
            .pipe(rename({suffix: '-' + gulp.env.cssjsdate}))
            .pipe(gulp.dest(path.joinFormat(__dirname, 'dist', iConfig.dest.path.assets)));
});

gulp.task('rev-remote-build', function(){
    var 
        iConfig = taskInit(),
        md5Filter = filter(function(file){
            return !/-[a-zA-Z0-9]{10}\.?\w*\.\w+/.test(file.history);

        }, {restore: true});

    if(!iConfig ||!remoteRevData){
        console.log('rev-remote-build done, no remoteRevData'.yellow);
        return;
    }
    
    return gulp.src([
            path.joinFormat(__dirname, 'dist', iConfig.dest.path.root, '**/*.*'), 
                '!**/*.html', 
                '!**/assets/**/*.*'
            ], { 
                base: path.joinFormat(__dirname, 'dist') 
            })
            .pipe(md5Filter)
            .pipe(
                through.obj(function(file, enc, next){
                    if(remoteRevData){
                        var iPath = remoteRevData[path.joinFormat(path.relative(path.join(__dirname, 'dist'), file.path)) ];

                        if(iPath){
                            file.path = path.joinFormat(__dirname, 'dist',iPath) ;
                        }
                        this.push(file);

                    }

                    next();
                })
             )
            .pipe(gulp.dest(path.joinFormat(__dirname, 'dist')));
            
});

gulp.task('rev-dataInit', function(done){
    var 
        iConfig = taskInit(),
        revPath = path.joinFormat(__dirname, 'dist', iConfig.dest.path.assets, 'rev-manifest.json');

    if(!iConfig || !fs.existsSync(revPath)){
        return;
    }

    localRevData = require(revPath);
    if(remoteRevData){
        localRevData = fn.extend(localRevData, remoteRevData);
    }

    done();

});

gulp.task('rev-replace', function(){
    var 
        iConfig = taskInit();

    if(!iConfig || !localRevData){
        return;
    }

    return gulp.src( path.joinFormat(__dirname, 'dist', iConfig.dest.path.root, '**/*.+(html|js|css)'), { base: path.joinFormat(__dirname, 'dist') })
            .pipe(plumber())
            .pipe(through.obj(function(file, enc, next){
                var iCnt = file.contents.toString();

                for(var key in localRevData){
                    if(localRevData.hasOwnProperty(key) && key != 'version'){
                        iCnt = iCnt.replace(new RegExp(key, 'g'), localRevData[key]);
                    }
                }


                file.contents = new Buffer(iCnt, 'utf-8');
                this.push(file);
                next();
            }))
            .pipe(gulp.dest(path.joinFormat(__dirname, 'dist')))
            .pipe(rev.manifest())
            .pipe(through.obj(function(file, enc, next){
                var iCnt = file.contents.toString();
                try{
                    var 
                        iJson = JSON.parse(iCnt);
                    iJson.version = gulp.env.cssjsdate;
                    iCnt = JSON.stringify(iJson, null, 4);
                } catch(er){}

                file.contents = new Buffer(iCnt, 'utf-8');
                this.push(file);
                next();
            }))
            .pipe(gulp.dest(path.joinFormat(__dirname, 'dist', iConfig.dest.path.assets)))
            .pipe(livereload({quiet: true}));

});

gulp.task('rev-update', function(done){
    if(gulp.env.runAll){
        done();
    } else {
        runSequence('rev-loadRemote', 'rev-update-task', 'rev-remote-build', 'rev-dataInit', 'rev-replace', done);
    }
});

gulp.task('rev-update-task', function(){
    var iConfig = taskInit();
    if(!iConfig){
        return;
    }

    var 
        now = new Date(),
        addZero = function(num) {
            return num < 10 ? '0' + num : num;
        },
        md5Filter = filter(function(file){
            return !/-[a-zA-Z0-9]{10}\.?\w*\.\w+/.test(file.history);

        }, {restore: true});

    gulp.env.cssjsdate = now.getFullYear() + addZero(now.getMonth() + 1) + addZero(now.getDate()) + addZero(now.getHours()) + addZero(now.getMinutes()) + addZero(now.getSeconds());



    var iPath;
    switch(gulp.env.nowTask){
        case 'css':
            iPath = path.joinFormat(__dirname, 'dist', iConfig.dest.path.css, '**/*.css');
            break;

        case 'html':
            iPath = path.joinFormat(__dirname, 'dist', iConfig.dest.path.html, '**/*.css');
            break;
            
        case 'js':
            iPath = path.joinFormat(__dirname, 'dist', iConfig.dest.path.js, '**/*.js');
            break;

        case 'images':
            iPath = path.joinFormat(__dirname, 'dist', iConfig.dest.path.images, '**/*.+(jpg|jpeg|png|bmp|gif)');
            break;

        default:
            break;
    }

    if(!iPath){
        return;
    }

    return gulp.src(iPath, { 
                base: path.joinFormat(__dirname, 'dist') 
            })
            .pipe(md5Filter)
            .pipe(rev())
            .pipe(gulp.dest(path.joinFormat(__dirname, 'dist')))
            .pipe(rev.manifest({
                merge: true
            }))
            .pipe(gulp.dest(path.joinFormat(__dirname, 'dist', iConfig.dest.path.assets)));
});


gulp.task('css', function(done) {
    gulp.env.nowTask = 'css';
    runSequence('css-task', 'concat', 'rev-update', done);

});

gulp.task('css-task', function() {
    var iConfig = taskInit();
    if(!iConfig){
        return;
    }
    process.chdir( path.joinFormat(__dirname, iConfig.src, 'components'));
    return sass('./', { style: 'nested', 'compass': true })
        .pipe(filter('@(p-)*/*.css'))
        .pipe(through.obj(function(file, enc, next){
            var iCnt = file.contents.toString();
            var pathReg = /(url\s*\(['"]?)([^'"]*?)(['"]?\s*\))/ig;
            var pathReg2 = /(src\s*=\s*['"])([^'" ]*?)(['"])/ig;
            var dirname = path.joinFormat(__dirname, iConfig.src, 'css');

            var replaceHandle = function(str, $1, $2, $3){
                var iPath = $2,
                    rPath = '';

                if(iPath.match(/^(about:|data:)/)){
                    return str;
                }

                var fDirname = path.dirname(path.relative(dirname, file.path));
                rPath = path.join(fDirname, iPath)
                    .replace(/\\+/g,'/')
                    .replace(/\/+/, '/')
                    ;
                if(fs.existsSync(path.joinFormat(dirname, rPath).replace(/\?.*?$/g,''))){
                    return $1 + rPath + $3;

                } else {

                    console.log(([
                        '',
                        '[error] css url replace error!',
                        file.history,
                        '[' + rPath + '] is not found!'].join("\n")
                    ).yellow);
                    return str;
                }

            };


            iCnt = iCnt
                .replace(pathReg, replaceHandle)
                .replace(pathReg2, replaceHandle);

            file.contents = new Buffer(iCnt, 'utf-8');
            this.push(file);
            next();
        }))
        .pipe(rename(function(path){
            path.dirname = '';
            path.basename = path.basename.replace(/^p-/,'');
        }))
        .pipe(gulp.dest('../css/'))
        // 替换全局 图片
        .pipe(replacePath(
            path.joinFormat(
                path.relative(
                    path.join(__dirname, iConfig.src, 'css'),
                    path.join(__dirname, iConfig.global.components)
                )
            ),
            path.joinFormat(iConfig.dest.hostname, iConfig.dest.path.images, 'globalcomponents')
        ))

        .pipe(replacePath('../images', path.joinFormat(iConfig.dest.hostname, iConfig.dest.path.images)))
        .pipe(replacePath('../components', path.joinFormat(iConfig.dest.hostname, iConfig.dest.path.images, 'components')))
        .pipe(iConfig.isCommit?minifycss({
            compatibility: 'ie7'
        }): fn.blankPipe())

        
        
        .pipe(gulp.dest( path.joinFormat(__dirname, 'dist', iConfig.dest.path.css)))
        
        // .pipe(notify({ message: 'CSS task complete' }))
        .pipe(livereload({quiet: true}))
        ;
});

gulp.task('images',['images-img', 'images-components', 'images-globalcomponents'], function(done) {
    gulp.env.nowTask = 'images';
    runSequence('rev-update', done);
});

gulp.task('images-img', function() {
    var iConfig = taskInit();
    if(!iConfig){
        return;
    }
    return gulp.src([ path.joinFormat(__dirname, iConfig.src, 'images/**/*.*')], {base: path.joinFormat(__dirname, iConfig.src, 'images')})
        .pipe(filter(['**/*.jpg', '**/*.jpeg', '**/*.png', '**/*.bmp', '**/*.gif']))
        .pipe(iConfig.isCommit?imagemin({ optimizationLevel: 3, progressive: true, interlaced: true }): fn.blankPipe())
        .pipe(gulp.dest( path.joinFormat(__dirname, 'dist', iConfig.dest.path.images)))
        // .pipe(notify({ message: 'Images-img task complete' }))
        .pipe(livereload({quiet: true}));
});
gulp.task('images-components', function(){
    var iConfig = taskInit();
    if(!iConfig){
        return;
    }
    return gulp.src([
            path.joinFormat(__dirname, iConfig.src, 'components/**/*.*'),
            '!**/*.tpl',
            '!**/*.jade',
            '!**/*.js',
            '!**/*.scss',
            '!**/*.html',
            '!**/*.css',
            '!**/*.md',
            '!**/*.psd'
        ], {
            base: path.joinFormat(__dirname, iConfig.src, 'components')
        })
        .pipe(plumber())
        .pipe(iConfig.isCommit?imagemin({ optimizationLevel: 3, progressive: true, interlaced: true }): fn.blankPipe())
        .pipe(gulp.dest( path.joinFormat(__dirname, 'dist', iConfig.dest.path.images, 'components')))
        // .pipe(notify({ message: 'Images-components task complete' }))
        .pipe(livereload({quiet: true}));
});
gulp.task('images-globalcomponents', function(){
    var iConfig = taskInit();
    if(!iConfig){
        return;
    }
    var rConfig = require(path.joinFormat(__dirname, iConfig.src, 'js/rConfig/rConfig.js')),
        copyPaths = [],
        fPath;

    for(var key in rConfig.paths){
        if(rConfig.paths.hasOwnProperty(key)){
            fPath = path.joinFormat(__dirname, iConfig.src, 'js/rConfig', path.dirname(rConfig.paths[key]));
            if(new RegExp('^' + path.joinFormat(__dirname, iConfig.global.components)).test(fPath)){
                copyPaths.push(path.joinFormat(fPath, '**/*.*'));
            }
        }
    }

    if(!copyPaths.length){
        return console.log('[notice] no globalcomponents in this project'.yellow);
    }


    return gulp.src(copyPaths, {
            base: path.joinFormat(__dirname, iConfig.global.components)
        })
        .pipe(plumber())
        .pipe(filter(['**/*.jpg', '**/*.jpeg', '**/*.png', '**/*.bmp', '**/*.gif']))
        .pipe(gulp.dest(path.joinFormat(__dirname, 'dist', iConfig.dest.path.images, 'globalcomponents')))
        // .pipe(notify({ message: 'Images-globalcomponents task complete' }))
        .pipe(livereload({quiet: true}));
});



gulp.task('watch', function() {
    var iConfig = taskInit();
    if(!iConfig){
        return;
    }
    livereload.listen();


    // 看守所有.scss档
    gulp.watch( path.joinFormat(__dirname, iConfig.src, '**/*.scss'), ['css', 'html']);

    // 看守所有.js档
    gulp.watch([
        path.joinFormat(__dirname, iConfig.src, 'components/**/*.js'),
        path.joinFormat(__dirname, iConfig.src, 'js/lib/**/*.js'),
        path.joinFormat(__dirname, iConfig.global.components, '**.*.js')
    ], ['js', 'html']);

    // 看守所有图片档
    gulp.watch([
        path.joinFormat(__dirname, iConfig.src, 'images/*.*'),
        path.joinFormat(__dirname, iConfig.src, 'components/**/images/*.*'),
        path.joinFormat(__dirname, iConfig.global.components, '**/images/*.')
    ], ['images', 'html']);

    // 看守所有jade 文件
    gulp.watch([
        path.joinFormat(__dirname, iConfig.src, 'components/**/*.jade'),
        path.joinFormat(__dirname, iConfig.src, 'templates/**/*.jade'),
        path.joinFormat(__dirname, iConfig.global.components, '**/*.jade')
    ], ['html']);


});
gulp.task('copy', function(){
    gulp.env.isCommit = true;
    var iConfig = taskInit();
    if(!iConfig){
        return;
    }
    var 
        svnConfig = iConfig.svn,
        iBranch = gulp.env.subname;


    if(!iBranch || !svnConfig.path[iBranch]){
        return console.log(gulp.env.subname + ' is not in svnConfig'.red);
    }

    if(!svnConfig.copy){
        return;
    }

    var 
        events = [],
        copyHandle = function(src){
            var iPath = path.joinFormat(__dirname, ctxRender(src, iConfig));
            var iStat = fs.statSync(iPath);
            var iStream;

            if(iStat.isDirectory()){
                console.log('[source] ', path.joinFormat(__dirname, ctxRender(src, iConfig), '**/*.*').yellow);
                iStream = gulp.src(path.joinFormat(__dirname, ctxRender(src, iConfig), '**/*.*'));

            } else {
                console.log('[source] ', path.joinFormat(__dirname, ctxRender(src, iConfig)).yellow);
                iStream = gulp.src([path.joinFormat(__dirname, ctxRender(src, iConfig))]);
            }

            var dests = svnConfig.copy[src];


            dests.forEach(function(dest){
                console.log('[target] ', path.joinFormat(__dirname, ctxRender(dest)).green);
                iStream.pipe(gulp.dest(path.joinFormat(__dirname, ctxRender(dest))));
            });
            events.push(iStream);

        };
    for(var src in svnConfig.copy){
        if(svnConfig.copy.hasOwnProperty(src)){
            copyHandle(src);
        }
    }
    return es.concat.apply(es, events);
});

gulp.task('concat', function(){
    var iConfig = taskInit();
    if(!iConfig){
        return;
    }
    if(!iConfig.dest.concat){
        return;
    }


    var 
        events = [],
        concatHandle = function(dist, list){
            var iSrcs = [];
            var outputRoot = 'dist';

            if(/^\.\//.test(dist)){
                outputRoot = '';
            }

            list.forEach(function(src){
                iSrcs.push(path.joinFormat(__dirname, outputRoot, src));
            });
            var iStream = gulp.src(iSrcs);

            iStream
                .pipe(concat(dist))
                .pipe(gulp.dest(path.join(__dirname, outputRoot)))
                .pipe(notify({ message: 'concat task complete' }));

            events.push(iStream);
        };
    for(var dist in iConfig.dest.concat){
        if(iConfig.dest.concat.hasOwnProperty(dist)){
            concatHandle(dist, iConfig.dest.concat[dist]);
        }
    }
    return es.concat.apply(es, events);


    
});

gulp.task('commit', function(done){
    gulp.env.isCommit = true;
    runSequence('commit-step01', 'all', 'copy', 'commit-step02', 'commit-step03', done);
});


gulp.task('commit-step01', function(done){
    gulp.env.isCommit = true;

    var iConfig = taskInit();
    if(!iConfig){
        return;
    }
    var 
        svnConfig = iConfig.svn,
        gitConfig = iConfig.git,
        iBranch = gulp.env.subname;

    gulp.env.commitTime = new Date();
    

    if(!iBranch || !svnConfig.path[iBranch]){
        return console.log(gulp.env.subname + ' is not in svnConfig'.red);
    }

    console.log('commit step 01 start'.yellow);
    new fn.Promise(function(NEXT){ // 删除动态文件
        // update 文件
        if(svnConfig.update){
            var iPromise = new fn.Promise();

            svnConfig.update.forEach(function(iPath){
                var mPath = path.joinFormat(__dirname, ctxRender(iPath));
                iPromise.then(function(next){
                    console.log(('svn update \n['+ mPath +']').yellow);
                    fn.runCMD('svn update', function(){
                        console.log('done'.green);
                        next();
                    }, mPath, true);
                });
                
            });
            iPromise.then(function(){
                console.log('svn config.udpate is done'.yellow);
                NEXT();
            });
            iPromise.start();

        } else {
            console.log('svn config.udpate is blank'.yellow);
            NEXT();
        }
    }).then(function(NEXT){ // update git
        // update 文件
        if(gitConfig.update){
            var iPromise = new fn.Promise();

            gitConfig.update.forEach(function(iPath){
                var mPath = path.joinFormat(__dirname, ctxRender(iPath));
                iPromise.then(function(next){
                    console.log(('git pull \n['+ mPath +']').yellow);
                    fn.runCMD('git pull', function(){
                        console.log('done'.green);
                        next();
                    }, mPath, true);
                });
                
            });
            iPromise.then(function(){
                console.log('git config.udpate is done'.yellow);
                NEXT();
            });
            iPromise.start();

        } else {
            console.log('git config.udpate is blank'.yellow);
            NEXT();
        }
        
    }).then(function(next){ // 添加 被删除的文件夹
        var delPath = [];

        // 删除 commit 设置下的文件
        if(svnConfig.commit){
            svnConfig.commit.forEach(function(iPath){
                delPath.push(path.joinFormat(__dirname, ctxRender(iPath)));
            });
        }

        fn.removeFiles(delPath, function(){
            console.log('svn.update, svn.commit files deleted'.yellow);
            next(delPath);
        });

    }).then(function(delPath ,next){ // 添加 被删除的文件夹
        delPath.forEach(function(iPath){
            if(!path.extname(iPath) && !fs.existsSync(iPath)){
                fs.mkdirSync(iPath);
            }
        });
        console.log('svn.update, svn.commit files doc added'.yellow);

        next(delPath);

    }).then(function(delPath ,NEXT){ // update 被删除的文件
        var iPromise = new fn.Promise();


        delPath.forEach(function(iPath){
            iPromise.then(function(next){
                console.log(('svn update ['+ iPath +']').yellow);
                process.chdir(iPath);
                fn.runCMD('svn update', function(){
                    console.log('done'.green);
                    next();
                }, path.joinFormat(iPath), true);
            });
            
        });

        iPromise.then(function(){
            console.log('svn.update, svn.commit files updated'.yellow);
            NEXT();
        });
        iPromise.start();

    }).then(function(){
        console.log('commit step 01 passed'.green);

        if(svnConfig.onBeforeCommit){
            console.log('onBeofreCommit task run'.yellow);
            svnConfig.onBeforeCommit(iBranch);
        }

        done();

    }).start();
    // 拉取 svn 

});

gulp.task('commit-step02', function(done){
    gulp.env.isCommit = true;

    var iConfig = taskInit();
    if(!iConfig){
        return;
    }

    var 
        svnConfig = iConfig.svn,
        assetsPath = [],
        delFiles = [],
        revRelate = path.relative(iConfig.dest.path.assets, './');

    svnConfig.commit.forEach(function(item){
        if(/assets/.test(item)){
            assetsPath.push(item);
        }
    });

    if(assetsPath.length){
        console.log('commit step 02 start: rev svn Path clean');

        assetsPath.forEach(function(src){
            var iPath = path.joinFormat(__dirname, ctxRender(src));
            var files = fs.readdirSync(iPath);
            var oldRevs;
            var keepRevs;
            
            // 排序
            files.sort(function(a,b){
                if(a === 'rev-manifest.json'){
                    return -1;
                } else if(b == 'rev-manifest.json'){
                    return 1;
                } else {
                    var 
                        aVer = +a.replace(/rev-manifest-(\d+)\.json/, '$1'),
                        bVer = +b.replace(/rev-manifest-(\d+)\.json/, '$1');


                    return bVer - aVer;
                }

            });

            if(files.length >= 3){ // 删除最新版本 往下 三个版本以后生成的文件 
                oldRevs = files.slice(3);
                keepRevs = files.slice(0, 3);
                oldRevs.forEach(function(oldRev){
                    var 
                        revFile = path.joinFormat(iPath, oldRev),
                        revData,
                        delPath;

                    try{
                        revData = require(revFile);
                    } catch(er){
                        revData = {};
                    }

                    for(var key in revData){
                        if(revData.hasOwnProperty(key) && key != 'version'){
                            delPath = path.joinFormat(iPath, revRelate, revData[key]);
                            if(!~delFiles.indexOf(delPath)){
                                delFiles.push(delPath);
                            }
                        }
                    }

                    // 删除对应的 rev-manifest.json
                    if(!~delFiles.indexOf(revFile)){
                        delFiles.push(revFile);
                    }
                });

                keepRevs.forEach(function(revPath){ // 保留 最新的 3 个 版本下生成的文件
                    var 
                        revData = require(path.join(iPath, revPath)),
                        keepPath;

                    for(var key in revData){
                        if(revData.hasOwnProperty(key) && key != 'version'){
                            keepPath = path.joinFormat(iPath, revRelate, revData[key]);
                            if(~delFiles.indexOf(keepPath)){
                                delFiles.splice(delFiles.indexOf(keepPath), 1);
                            }
                        }
                    }
                });
            }

        });

        var iPromise = new fn.Promise();

        delFiles.forEach(function(src){
            if(fs.existsSync(src)){
                iPromise.then(function(next){
                    console.log(('[del] file: ' + src).yellow);
                    fn.runCMD([
                        'svn del ' + path.basename(src) + ' --force',
                    ].join(' && '), function(){
                        console.log('done'.green);
                        if(fs.existsSync(src)){
                            fs.unlinkSync(src);
                        }
                        next();
                    }, path.dirname(src));

                });
            }
        });
        iPromise.then(function(){
            console.log('==============');
            console.log('del file done');
            console.log('total ' + delFiles.length + ' files need delete');
            console.log('commit step 02 done'.green);
            console.log('==============');
            return done();
        });
        iPromise.start();
        

    } else {
        console.log('commit step 02 done, no assetsPath in svn commit'.yellow);
        return done();
    }

});

gulp.task('commit-step03', function(){
    gulp.env.isCommit = true;

    var iConfig = taskInit();
    if(!iConfig){
        return;
    }
    var 
        svnConfig = iConfig.svn,
        gitConfig = iConfig.git,
        iBranch = gulp.env.subname;

    

    if(!iBranch || !svnConfig.path[iBranch]){
        return console.log(gulp.env.subname + ' is not in svnConfig'.red);
    }


    console.log('commit step 03 start'.yellow);
    // svn commit！
    var iPromise = new fn.Promise();

    if(svnConfig.commit){
        svnConfig.commit.forEach(function(iPath){
            iPromise.then(function(next){
                var mPath = path.joinFormat(__dirname, ctxRender(iPath));
                console.log(('['+ mPath +']' + '\ncommit start').yellow);
                fn.runCMD([
                    'svn cleanup',
                    'svn add * --force',
                    'svn commit -m gulpAutoCommit'
                ].join(' && '), function(){
                    console.log('done'.green);
                    next();
                }, mPath);
            });
        });
    }
    if(gitConfig.commit){
       gitConfig.commit.forEach(function(iPath){
            iPromise.then(function(next){
                var mPath = path.joinFormat(__dirname, ctxRender(iPath));
                console.log(('['+ mPath +']' + '\ncommit start').yellow);
                fn.runCMD([
                    'git add',
                    'git commit -m "gulpAutoCommit"'
                ].join(' && '), function(){
                    console.log('done'.green);
                    next();
                }, mPath);
            });
        }); 
    }
    iPromise.then(function(next){
        console.log('all is done'.green);
        if(gulp.env.commitTime){
            var cost = new Date() -  gulp.env.commitTime;
            var min = Math.floor(cost / 1000 / 60);
            var sec = Math.floor(cost / 1000) % 60;
            var us = cost % 1000;
            console.log(('total ' + min + ' m ' + sec + ' s ' + us + 'ms').green);
        }
        next();
    });

    iPromise.start();
});

gulp.task('devserver', function() {
    gulp.src('./src')
        .pipe(server({
            livereload: {
                clientConsole: false
            },
            proxy: {
                enable: true,
                host: 'http://www.yy.com',
                urls: /^\/login\//
            }
        }));
});

gulp.task('all', function(done){
    gulp.env.runAll = true;
    runSequence(['js', 'css', 'images', 'html'], 'concat', 'rev', 'all-done', done);
});

gulp.task('all-done', function(){
    gulp.env.runAll = false;
});

gulp.task('watchAll', ['all', 'watch']);
