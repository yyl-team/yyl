'use strict';
var 
    gulp = require('gulp'),
    gutil = require('gulp-util'),
    extend = require('node.extend'),
    clean = require('gulp-clean'),
    // webpack = require('gulp-webpack'),
    webpack = require('webpack'),
    connect = require('gulp-connect'),
    runSequence = require('run-sequence'),
    es = require('event-stream'),
    fs = require('fs'),
    path = require('path'),
    config = require('./config.js'),
    http = require('http'),
    webpackConfig = require('./webpack.config.js');


require('colors');

if(fs.existsSync('./config.mine.js')){
    config = extend(config, require('./config.mine.js'));
}

path.joinFormat = function(){
    var iArgv = Array.prototype.slice.call(arguments);
    var r = path.join.apply(path, iArgv);
    return r
        .replace(/\\+/g, '/')
        .replace(/(^http[s]?:)[\/]+/g, '$1//');
};

var 
    fn = {
        makeVersion: function(){
            var
                addZero = function(num) {
                    return num < 10 ? '0' + num : num;
                },
                now = new Date();
            return now.getFullYear() + addZero(now.getMonth() + 1) + addZero(now.getDate()) + addZero(now.getHours()) + addZero(now.getMinutes()) + addZero(now.getSeconds());
        },
        configInit: function(){
            var 
                iSub = gulp.env.sub,
                iConfig = config.commit[iSub];

            return iConfig;
        },
        ctxRender: function(ctx){
            var vars = config.alias;
            if(vars){
                for(var key in vars){
                    if(vars.hasOwnProperty(key)){
                        ctx = ctx.replace(new RegExp('\\{\\$'+ key +'\\}', 'g'), vars[key]);
                    }
                }
            }
            return ctx;
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
                    return callback();
                }

            });
            child.stdout.setEncoding('utf8');
            
            if(showOutput){
                child.stdout.pipe(process.stdout);
                child.stderr.pipe(process.stderr);
            }
            
        },
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
        removeFiles: function(list, callback, filters){
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
        },
    };

gulp.task('default', function(){
    console.log([
        '',
        '',
        '  Ustage:' + ' gulp <command>',
        '',
        '',
        '  Commands:',
        '    ' + 'watch --ver <type>    init project and watch',
        '    ' + 'commit --sub <branch> pack & commit project to svn',
        '    ' + 'all                   init project',
        '  type:',
        '    ' + 'remote                get the remote md5 list',
        '    ' + 'branch                release|trunk',
        ''
    ].join(''));
});

gulp.task('connect', function(){
    connect.server({
        root: config.localserver.root,
        livereload: true,
        port: 5000
    });
});
gulp.task('connect-reload', function(){
    return gulp.src('./package.json')
        .pipe(connect.reload());
    
});

gulp.task('webpack', function(done){
    var 
        iWebpackConfig = extend({}, webpackConfig);


    if(gulp.env.pack){

        iWebpackConfig.plugins.push(new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false
            }
        }));

        iWebpackConfig.devtool = false;
    }

    if(gulp.env.ver == 'remote' || gulp.env.pack){
        iWebpackConfig.output.publicPath = path.joinFormat(config.remote.hostname, iWebpackConfig.output.publicPath);
        console.log('[change] change webpack publicPath', '=>', iWebpackConfig.output.publicPath);
    }

    webpack(iWebpackConfig, function(err, stats){
        if (err) {
          throw new gutil.PluginError('webpack', err);

        } else {
            gutil.log('[webpack]', 'run pass');

        }
        gutil.log('[webpack]', stats.toString());

        done();

    });

});

gulp.task('rev', function(done){

    var revPath = path.joinFormat(fn.ctxRender(config.path.rev)),
        pathTrans = function(src){
            if(/(\.css|\.css\.map)$/.test(src)){
                return path.joinFormat(path.relative( 
                    path.join(__dirname, config.localserver.revRoot), 
                    path.join(__dirname, config.path.jsDest, '../css', src)
                ));

            } else {
                return path.joinFormat(path.relative( 
                    path.join(__dirname, config.localserver.revRoot), 
                    path.join(__dirname, config.path.jsDest, src)
                ));

            }
            

        };

        new fn.Promise(function(next){
            var revData = {};
            var outRev = {};

            if(fs.existsSync(revPath)){
                revData = JSON.parse(fs.readFileSync(revPath));
                // revData = require(revPath);
            }

            // 将连地址标准化
            for(var src in revData){
                if(revData.hasOwnProperty(src)){
                    outRev[pathTrans(src)] = pathTrans(revData[src]);
                }
            }

            next(outRev);
        }).then(function(outRev, next){ // 生成原来的文件
            
            var fPath = '';
            for(var src in outRev){
                if(outRev.hasOwnProperty(src) && /css|js|map/.test(path.extname(src))){
                    fPath = path.join(__dirname, config.localserver.revRoot, outRev[src]);
                    if(fs.existsSync(fPath)){
                        fs.writeFileSync(
                            path.join(__dirname, config.localserver.revRoot, src), 
                            fs.readFileSync(fPath)
                        );
                        console.log('[create] file:'.green, src);
                    }
                    
                }
            }
            next(outRev);


        }).then(function(revData, next){ // 拉去 remote 上的 和本地的 rev数据合并， 并生成一份文件
            var outRev = extend({}, revData);
            if(gulp.env.ver == 'remote' && gulp.env.sub){
                var 
                    iConfig = fn.configInit();

                console.log('start get the revFile', iConfig.revAddr.green);

                fn.get(iConfig.revAddr + '?' + (+new Date()), function(data){
                    console.log('================'.green);
                    console.log(data.toString());
                    console.log('================'.green);
                    try{
                        var 
                            remoteRevData = JSON.parse(data.toString()),
                            fPath = '';

                        outRev = extend({}, revData, remoteRevData);
                        console.log('rev get!'.green);

                        for(var src in revData){
                            if(revData.hasOwnProperty(src)){
                                if(revData[src] != outRev[src]){
                                    fPath = path.join(__dirname, config.localserver.revRoot, revData[src]);
                                    if(fs.existsSync(fPath)){
                                        fs.writeFileSync(
                                            path.join(__dirname, config.localserver.revRoot, outRev[src]), 
                                            fs.readFileSync(fPath)
                                        );
                                        console.log('[create] file:'.green, revData[src]);
                                    }
                                    
                                }
                            }
                        }

                    } catch(er){
                        console.log('rev get fail'.red, er);
                    }
                    next(outRev);
                });

            } else {
                next(outRev);
            }
        }).then(function(outRev){ // 写入原有文件
            fs.writeFileSync(config.path.rev, JSON.stringify(outRev, null, 4));
            console.log('[UPD] update the rev file'.green, config.path.rev);
            console.log(outRev);

            done();

        }).start();

});

gulp.task('sss', function(){
});

gulp.task('commit', function(done){
    gulp.env.pack = true;
    runSequence('commit-clean', 'commit-update', 'all', 'commit-copy', 'commit-beforefinal', 'commit-final', done);
});

gulp.task('commit-clean', function(){
    return gulp.src(config.path.dest)
            .pipe(clean({force: true}));
});

gulp.task('commit-update', function(done){

    var 
        iConfig = fn.configInit();

    if(!iConfig){
        return;
    }

    var 
        iPromise = new fn.Promise();

    if(iConfig.git && iConfig.git.update && gulp.env.git){
        iConfig.git.update.forEach(function(src){
            iPromise.then(function(next){
                fn.runCMD('git pull', function(err){
                    if(err){
                        console.log('[ERROR] git pull error'.red);
                    }
                    next();

                }, path.joinFormat(fn.ctxRender(src)));
            });
        });
        
    }

    if(iConfig.svn){
        if(iConfig.svn.update){
            iConfig.svn.update.forEach(function(src){

                iPromise.then(function(next){
                    console.log('[DEL] removeFile -'.blue, path.joinFormat(fn.ctxRender(src)));
                    fn.removeFiles(path.joinFormat(fn.ctxRender(src)), function(){
                        console.log('[DONE] removeFile -'.green, path.joinFormat(fn.ctxRender(src)));
                        next();
                    });
                });

                iPromise.then(function(next){
                    console.log('[UPDATE] update file -'.blue, path.joinFormat(fn.ctxRender(src)));
                    fn.runCMD('svn update', function(err){
                        if(err){
                            console.log('[ERROR] svn update -'.red, path.joinFormat(fn.ctxRender(src)));
                        } else {
                            console.log('[SUCCESS] svn update -'.green, path.joinFormat(fn.ctxRender(src)));
                            next();
                        }

                    }, path.joinFormat(fn.ctxRender(src)));
                });
            });
        }

        if(iConfig.svn.commit){
            iConfig.svn.commit.forEach(function(src){
                iPromise.then(function(next){
                    console.log('[DEL] removeFile -'.blue, path.joinFormat(fn.ctxRender(src)));
                    fn.removeFiles(path.joinFormat(fn.ctxRender(src)), function(){
                        console.log('[DONE] removeFile -'.green, path.joinFormat(fn.ctxRender(src)));
                        next();
                    });
                });

                iPromise.then(function(next){
                    console.log('[UPDATE] update file -'.blue, path.joinFormat(fn.ctxRender(src)));
                    fn.runCMD('svn update', function(err){
                        if(err){
                            console.log('[ERROR] svn update -'.red, path.joinFormat(fn.ctxRender(src)));
                        } else {
                            console.log('[SUCCESS] svn update -'.green, path.joinFormat(fn.ctxRender(src)));
                            next();
                        }

                    }, path.joinFormat(fn.ctxRender(src)));
                });

            });
        }
    }

    iPromise.then(function(){
        console.log('[DONE] update task done'.green);
        done();

    }).start();
});

gulp.task('commit-copy', function(){

    var 
        iConfig = fn.configInit(),
        svnConfig = iConfig.svn;

    var events = [],
        iStat,
        iPath,
        iStream,
        dests,
        destFn = function(dest){
            console.log('[TO] copy to -'.blue, path.joinFormat(__dirname, fn.ctxRender(dest)));
            iStream.pipe(gulp.dest(path.joinFormat(__dirname, fn.ctxRender(dest))));
        };
    for(var src in svnConfig.copy){
        if(svnConfig.copy.hasOwnProperty(src)){
            iPath = path.joinFormat(__dirname, fn.ctxRender(src));
            iStat = fs.statSync(iPath);

            if(iStat.isDirectory()){
                console.log('[COPY] copy file -'.blue, path.joinFormat(__dirname, fn.ctxRender(src), '**/*.*'));
                iStream = gulp.src(path.joinFormat(__dirname, fn.ctxRender(src), '**/*.*'));

            } else {
                console.log('[COPY] copy file -'.blue, path.joinFormat(__dirname, fn.ctxRender(src, iConfig)));
                iStream = gulp.src([path.joinFormat(__dirname, fn.ctxRender(src, iConfig))]);
            }

            dests = svnConfig.copy[src];

            dests.forEach(destFn);
            events.push(iStream);
        }
    }
    return es.concat.apply(es, events);
});

gulp.task('commit-beforefinal', function(){
    
    var 
        iconfig = fn.configInit(),
        cssjsdate = fn.makeVersion();


    if(!iconfig.versionFile){
        return;
    }


    var
        versionFile = path.joinFormat(__dirname, fn.ctxRender(iconfig.versionFile)),

        content = fs.readFileSync(versionFile).toString()
            .replace(/(<c\:set var \= \'cssjsdate\' value=\")\d+(\" \/\>)/g, '$1' + cssjsdate + '$2');

    fs.writeFileSync(versionFile, content);


    console.log('[DONE] rewrite version ok -'.green + versionFile);
});

gulp.task('commit-final', function(){
    var 
        iconfig = fn.configInit(),
        svnConfig = iconfig.svn;

    var iPromise = new fn.Promise();

    if(svnConfig.commit){
        svnConfig.commit.forEach(function(iPath){
            iPromise.then(function(next){
                var mPath = path.joinFormat(__dirname, fn.ctxRender(iPath));
                console.log('[COMMIT] commit file start -'.blue + mPath);
                fn.runCMD([
                    'svn cleanup',
                    'svn add * --force',
                    'svn commit -m gulpAutoCommit'
                ].join(' && '), function(err){
                    if(err){
                        console.log('[ERR] commit file fail -'.red + mPath);
                    } else {
                        console.log('[SUCCESS] commit file done -'.green + mPath);
                    }
                    next();
                }, mPath);
            });
        });
    }
    
    iPromise.then(function(){
        console.log('==============='.green);
        console.log('all is done'.green);
        gulp.env.pack = false;
    }).start();
});


gulp.task('all', function(done){
    runSequence('webpack', 'rev', done);
});

gulp.task('watch', ['connect', 'all'], function(){
    
    gulp.watch(['./src/**/*.*'], function(){
        runSequence('all','connect-reload');
    });
});
