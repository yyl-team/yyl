'use strict';
/*!
 * gulpfile.js for yym-FETeam
 *
 * @author: jackness Lau
 */ 


var gulp = require('gulp'),
    fs = require('fs'),
    path = require('path'),
    querystring = require('querystring'),
    util = require('../../lib/yyl-util'),

    sass = require('gulp-sass'), // sass compiler
    minifycss = require('gulp-minify-css'), // minify css files
    jshint = require('gulp-jshint'), // check js syntac
    uglify = require('gulp-uglify'), // uglify js files
    imagemin = require('gulp-imagemin'), // minify images
    rename = require('gulp-rename'), // rename the files
    concat = require('gulp-concat'), // concat the files into single file
    replacePath = require('gulp-replace-path'), // replace the assets path
    inlinesource = require('gulp-inline-source'), // requirejs optimizer which can combine all modules into the main js file
    babel = require('gulp-babel'),
    filter = require('gulp-filter'), // filter the specified file(s) in file stream
    browserify = require('gulp-browserify'),
    gulpJade = require('gulp-jade'),
    plumber = require('gulp-plumber'),
    runSequence = require('run-sequence').use(gulp),
    prettify = require('gulp-prettify'),
    rev = require('gulp-rev'),
    clean = require('gulp-clean'),

    through = require('through2'),
    es = require('event-stream'),

    cache = {
        remoteRevData: '',
        localRevData: ''
    };

require('colors');

var 
    config = require('./config.js'),
    localConfig = fs.existsSync('./config.mine.js')? require('./config.mine.js'): {};

config = util.initConfig(util.extend(true, config, localConfig));



var fn = {
    blankPipe: function(){
        return through.obj(function(file, enc, next){next(null, file);});
    },
    relateDest: function(iPath){
        return util.joinFormat( path.relative(gulp.env.vars.destRoot, iPath) );
    },
    taskHelper: function(commands){

        var dirs = [];
        var output;
        if(!config.alias){
            for(var key in config){
                if(config.hasOwnProperty(key)){
                    dirs.push(key);
                }
            }

            output = [
                '',
                '',
                '  Ustage:'.yellow,
                '  yyl '+ commands +' --name <Project>',
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
                '  yyl '+ commands +' not work',
                ''
            ];
        }
        console.log(output.join('\n'));
    },

    /**
     * task 执行前初始化函数
     */
    taskInit: function(){
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

        if(!iConfig || !iConfig.alias){
            fn.taskHelper(commands);
            process.exit();
            return;

        } else {
            gulp.env.vars = iConfig.alias;
            gulp.env.remotePath = gulp.env.ver == 'remote' || gulp.env.isCommit? iConfig.commit.hostname: '/';
            return iConfig;
        }

    }
};


// + html task
gulp.task('html', function(done){
    gulp.env.nowTask = 'html';
    runSequence('html-task', 'html-task-step02', done);

});
gulp.task('html-task', function(){
    var 
        iConfig = fn.taskInit();

    if(!iConfig){
        return;
    }

    var 
        vars = gulp.env.vars,
        
        // tmpl task
        tmplStream = gulp.src( util.joinFormat( iConfig.alias.srcRoot, 'components/@(p-)*/*.jade'))
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
                var dirname = util.joinFormat( iConfig.alias.srcRoot, 'html');


                iCnt = iCnt
                    // 隔离 script 内容
                    .replace(scriptReg, function(str, $1, $2, $3){
                        return $1 + querystring.escape($2) + $3;
                    })
                    .replace(pathReg, function(str, $1, $2, $3, $4){
                        var iPath = $3,
                            rPath = '';


                        iPath = iPath.replace(/\{\$(\w+)\}/g, function(str, $1){
                            if(vars[$1]){
                                
                                return path.relative( path.dirname(file.path), vars[$1]);
                            } else {
                                return str;
                            }
                        });

                        if(iPath.match(/^(data:image|javascript:|#|http:|https:|\/)/) || !iPath){
                            return str;
                        }


                        var fDirname = path.dirname(path.relative(dirname, file.path));
                        rPath = util.joinFormat(fDirname, iPath)
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
            .pipe(gulp.dest(util.joinFormat(vars.srcRoot, 'html')));



    return tmplStream;
});

gulp.task('html-task-step02', function(){
    var 
        iConfig = fn.taskInit();

    if(!iConfig){
        return;
    }

    var 
        vars = gulp.env.vars,
        relateHtml = function(iPath){
            return util.joinFormat(
                path.relative(
                    path.join(gulp.env.vars.srcRoot, 'html'),
                    iPath
                )
            );
        },
        relateDirname = function(iPath){
            return util.joinFormat(
                path.relative(
                    path.join(gulp.env.vars.dirname),
                    iPath
                )
            );

        },
        remotePath = gulp.env.remotePath;


    // html task
    return gulp.src( util.joinFormat(vars.srcRoot, 'html/*.html'))
        .pipe(plumber())
        .pipe(inlinesource())
        // 删除requirejs的配置文件引用
        .pipe(replacePath(/<script [^<]*local-usage\><\/script>/g, ''))

        // 将用到的 commons 目录下的 images 资源引入到项目里面
        .pipe(through.obj(function(file, enc, next){
            var iCnt = file.contents.toString();
            var pathReg = /(url\s*\(['"]?)([^'"]*?)(['"]?\s*\))/ig;
            var pathReg2 = /(src\s*=\s*['"])([^'" ]*?)(['"])/ig;
            var gComponentPath = relateHtml(vars.globalcomponents);
            var copyPath = {};

            var filterHandle = function(str, $1, $2){
                var iPath = $2;

                if(iPath.match(/^(about:|data:)/)){
                    return str;
                }


                if(iPath.substr(0, gComponentPath.length) != gComponentPath){
                    return str;
                }

                var dirname = iPath.substr(gComponentPath.length);

                copyPath[util.joinFormat(vars.srcRoot, 'html', iPath)] = util.joinFormat(vars.imagesDest, 'globalcomponents', dirname);

                return str;

            };


            iCnt
                .replace(pathReg, filterHandle)
                .replace(pathReg2, filterHandle);

            this.push(file);

            // 复制
            util.msg.info('copy file start', copyPath);
            util.copyFiles(copyPath, function(){
                util.msg.success('copy file done');
                next();
            });
        }))

        // 替换全局 图片
        .pipe(replacePath(
            relateHtml(path.join(vars.globalcomponents)),
            util.joinFormat(remotePath, fn.relateDest(vars.imagesDest), 'globalcomponents')
        ))
        // 替换 common 下 lib
        .pipe(replacePath(
            relateHtml(path.join(vars.globallib)),
            util.joinFormat(remotePath, fn.relateDest(vars.jslibDest), 'globallib')
        ))
        // 替换 jslib
        .pipe(replacePath('../js/lib', util.joinFormat(remotePath, fn.relateDest(vars.jslibDest))))
        // 替换 js
        .pipe(replacePath('../js', util.joinFormat(remotePath, fn.relateDest(vars.jsDest))))
        // 替换 components 中的js
        .pipe(replacePath(/\.\.\/components\/p-\w+\/p-(\w+).js/g, util.joinFormat( remotePath, fn.relateDest(vars.jsDest), '/$1.js')))


        .pipe(replacePath('../css', util.joinFormat( remotePath, fn.relateDest(vars.cssDest))))

        .pipe(replacePath('../images', util.joinFormat( remotePath, vars.imagesDest)))
        .pipe(replacePath(/\.\.\/(components\/[pw]-\w+\/images)/g, util.joinFormat( remotePath, fn.relateDest(vars.imagesDest), '$1')))

        // 把用到的 commons 目录下的 js 引入到 项目的 lib 底下
        .pipe(through.obj(function(file, enc, next){
            var iCnt = file.contents.toString();

            iCnt = iCnt
                .replace(new RegExp('[\'\"]'+ util.joinFormat(remotePath, fn.relateDest(vars.jslibDest), 'globallib') +'([^\'\"]*)[\"\']', 'g'), function(str, $1){
                    var sourcePath = util.joinFormat(vars.globallib, $1);
                    var toPath = util.joinFormat(vars.jslibDest, 'globallib', $1);
                    util.copyFiles(
                        sourcePath,
                        toPath,
                        function(err){
                            if(!err){
                                util.msg.create(relateDirname(toPath));
                            }
                        }
                    );
                    return str;
                });

            this.push(file);
            next();
        }))
        
        // .pipe(replacePath('../images', + assetsPath.images))
        .pipe(gulp.dest(vars.htmlDest));
});
// - html task

// + css task
gulp.task('css', function(done) {
    gulp.env.nowTask = 'css';
    runSequence('css-component-task', 'css-base-task', 'css-dist', 'concat', 'rev-update', done);

});

gulp.task('css-base-task', function(){
    var iConfig = fn.taskInit();
    if(!iConfig){
        return;
    }

    var vars = gulp.env.vars;

    return gulp.src([
            util.joinFormat(vars.srcRoot, 'sass/**/*.scss'),
            '!' + util.joinFormat(vars.srcRoot, 'sass/base/**/*.*')
        ])
        .pipe(sass({outputStyle: 'nested'}).on('error', sass.logError))
        .pipe(gulp.dest(path.join(vars.srcRoot, 'css')));

});

gulp.task('css-dist', function(){
    var iConfig = fn.taskInit();
    if(!iConfig){
        return;
    }

    var vars = gulp.env.vars,
        remotePath = gulp.env.remotePath,
        relateCss = function(iPath){
            return util.joinFormat(
                path.relative(
                    path.join(vars.srcRoot, 'css'),
                    iPath
                )
            );

        };

    return gulp.src(path.join(vars.srcRoot, 'css', '**/*.css'))
        // 将commons components 目录下的 图片 引入到 globalcomponents 里面
        .pipe(through.obj(function(file, enc, next){
            var iCnt = file.contents.toString();
            var pathReg = /(url\s*\(['"]?)([^'"]*?)(['"]?\s*\))/ig;
            var pathReg2 = /(src\s*=\s*['"])([^'" ]*?)(['"])/ig;
            var gComponentPath = relateCss(vars.globalcomponents);
            var copyPath = {};

            var filterHandle = function(str, $1, $2){
                var iPath = $2;

                if(iPath.match(/^(about:|data:)/)){
                    return str;
                }


                // console.log('vvvvvvvvvvvvvv')
                // console.log('111', iPath);
                // console.log('111', gComponentPath);
                // console.log('iiiiiiiiiiiiii')

                if(iPath.substr(0, gComponentPath.length) != gComponentPath){
                    return str;
                }

                iPath = iPath.replace(/\?.*?$/g,'');

                var dirname = iPath.substr(gComponentPath.length);
                copyPath[util.joinFormat(vars.srcRoot, 'css', iPath)] = util.joinFormat(vars.imagesDest, 'globalcomponents', dirname);

                return str;

            };


            iCnt
                .replace(pathReg, filterHandle)
                .replace(pathReg2, filterHandle);

            this.push(file);

            // 复制
            util.copyFiles(copyPath, function(){
                util.msg.success('copy file done');
                next();
            }, null, null, vars.dirname);
        }))
        // 替换 commons components 里面的 图片
        .pipe(replacePath(
            relateCss(vars.globalcomponents),
            util.joinFormat(remotePath, fn.relateDest(path.join(vars.imagesDest, 'globalcomponents')))
        ))

        // 替换图片
        .pipe(replacePath(
            '../images',
            util.joinFormat(remotePath, fn.relateDest(vars.imagesDest))
        ))
        // 替换 components 内图片
        .pipe(replacePath(
            '../components',
            util.joinFormat( remotePath, fn.relateDest( path.join(vars.imagesDest, 'components')))
        ))
        .pipe(iConfig.isCommit?minifycss({
            compatibility: 'ie7'
        }): fn.blankPipe())
        
        .pipe(gulp.dest( util.joinFormat(vars.cssDest)));
});

gulp.task('css-component-task', function() {
    var iConfig = fn.taskInit();
    if(!iConfig){
        return;
    }
    
    var vars = gulp.env.vars;
    
    return gulp.src(path.join(vars.srcRoot,'components/@(p-)*/*.scss'), {base: path.join(vars.srcRoot)})
        .pipe(sass({outputStyle: 'nested'}).on('error', sass.logError))
        .pipe(through.obj(function(file, enc, next){
            var iCnt = file.contents.toString();
            var pathReg = /(url\s*\(['"]?)([^'"]*?)(['"]?\s*\))/ig;
            var pathReg2 = /(src\s*=\s*['"])([^'" ]*?)(['"])/ig;
            var dirname = util.joinFormat(vars.srcRoot, 'css');

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

                if(fs.existsSync(util.joinFormat(dirname, rPath).replace(/\?.*?$/g,''))){
                    return $1 + rPath + $3;

                } else {

                    util.msg.warn('css url replace error', 'path not found:', rPath);
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
        .pipe(gulp.dest(path.join(vars.srcRoot, 'css')));
        
});
// - css task
// + js task
gulp.task('js', function (done) {
    gulp.env.nowTask = 'js';
    runSequence('js-task', 'concat', 'rev-update', done);
});
gulp.task('js-task', function () {
    var iConfig = fn.taskInit();
    if(!iConfig){
        return;
    }

    /* requirejs 主模块列表 & 页面js [start] */
    var 
        rjsFilter = filter(function (file) {
            var result = /([pj]\-[a-zA-Z0-9_]*)[\\\/]([pj]\-[a-zA-Z0-9_]*)\.js$/.test(file.path);
            if(result){
                file.base = util.joinFormat(file.path.replace(/([pj]\-[a-zA-Z0-9_]*)\.js$/, ''));
            }
            return result;
        });
    /* requirejs 主模块列表 & 页面js [end] */
    var
        vars = gulp.env.vars;

    // jsTask
    var 
        jsStream = gulp.src(path.join( vars.srcRoot, 'components/**/*.js'))
            .pipe(plumber())
            .pipe(jshint.reporter('default'))
            .pipe(rjsFilter)
            .pipe(jshint())
            .pipe(babel({
                presets: ['babel-preset-es2015'].map(require.resolve)
            }))
            .pipe(browserify({
                insertGlobals : true,
                debug: !gulp.env.isCommit
            }))
            .pipe(iConfig.isCommit?uglify(): fn.blankPipe())
            .pipe(rename(function(path){
                path.basename = path.basename.replace(/^[pj]-/g,'');
                path.dirname = '';
            }))
            .pipe(gulp.dest(util.joinFormat(vars.jsDest)));

    // js lib Task
    var 
        jsLibStream = gulp.src(util.joinFormat( vars.srcRoot, 'js/lib/**/*.js'))
            .pipe(plumber())
            .pipe(iConfig.isCommit?uglify():fn.blankPipe())
            .pipe(gulp.dest( vars.jslibDest ));

    var 
        jsBaseStream = gulp.src([
                util.joinFormat(vars.srcRoot, 'js/**/*.js'),
                '!' + util.joinFormat(vars.srcRoot, 'js/lib/**'),
                '!' + util.joinFormat(vars.srcRoot, 'js/widget/**')
            ])
        .pipe(plumber())
        /* 合并主文件中通过 requirejs 引入的模块 [start] */
        .pipe(babel({
            presets: ['babel-preset-es2015'].map(require.resolve)
        }))
        .pipe(browserify({
            insertGlobals : true,
            debug: !gulp.env.isCommit
        }))
        .pipe(iConfig.isCommit?uglify(): fn.blankPipe())
        .pipe(gulp.dest(util.joinFormat(vars.jsDest)));

    return es.concat.apply(es, [jsStream, jsLibStream, jsBaseStream]);
});
// - js task
// + images task
gulp.task('images',['images-img', 'images-components'], function(done) {
    gulp.env.nowTask = 'images';
    runSequence('rev-update', done);
});

gulp.task('images-img', function() {
    var iConfig = fn.taskInit();
    if(!iConfig){
        return;
    }
    var vars = gulp.env.vars;

    return gulp.src([ util.joinFormat( vars.srcRoot, 'images/**/*.*')], {base: util.joinFormat( vars.srcRoot, 'images')})
        .pipe(filter(['**/*.jpg', '**/*.jpeg', '**/*.png', '**/*.bmp', '**/*.gif']))
        .pipe(iConfig.isCommit?imagemin({ optimizationLevel: 3, progressive: true, interlaced: true }): fn.blankPipe())
        .pipe(gulp.dest( util.joinFormat(vars.imagesDest)))
        ;
});
gulp.task('images-components', function(){
    var iConfig = fn.taskInit();
    if(!iConfig){
        return;
    }

    var 
        vars = gulp.env.vars;

    return gulp.src([
            util.joinFormat( vars.srcRoot, 'components/**/*.*')
        ], {
            base: util.joinFormat( vars.srcRoot, 'components')
        })
        .pipe(plumber())
        .pipe(iConfig.isCommit?imagemin({ optimizationLevel: 3, progressive: true, interlaced: true }): fn.blankPipe())
        .pipe(filter(['**/*.jpg', '**/*.jpeg', '**/*.png', '**/*.bmp', '**/*.gif']))
        .pipe(gulp.dest( util.joinFormat( vars.imagesDest, 'components')))
        ;
});
// - images task
// + watch task
gulp.task('watch', ['all'], function() {
    var iConfig = fn.taskInit();
    if(!iConfig){
        return;
    }
    var vars = gulp.env.vars;


    // 看守所有.scss档
    gulp.watch( util.joinFormat( vars.srcRoot, '**/*.scss'), function(){
        runSequence('css', 'html', 'concat', 'connect-reload');
    });

    // 看守所有.js档
    gulp.watch([
        util.joinFormat(vars.srcRoot, 'components/**/*.js'),
        util.joinFormat(vars.srcRoot, 'js/lib/**/*.js'),
        util.joinFormat(vars.commons, '**.*.js')
    ], function(){
        runSequence('js', 'html', 'concat', 'connect-reload');
    });

    // 看守所有图片档
    gulp.watch([
        util.joinFormat(vars.srcRoot, 'images/*.*'),
        util.joinFormat(vars.srcRoot, 'components/**/images/*.*'),
        util.joinFormat(vars.globalcomponents, '**/images/*.')
    ], function(){
        runSequence('images', 'html', 'connect-reload');

    });

    // 看守所有jade 文件
    gulp.watch([
        util.joinFormat(vars.srcRoot, 'components/**/*.jade'),
        util.joinFormat(vars.srcRoot, 'templates/**/*.jade'),
        util.joinFormat(vars.globalcomponents, '**/*.jade')
    ], function(){
        runSequence('html', 'connect-reload');
    });

    runSequence('connect-reload');

    if(gulp.env.ver == 'remote'){
        return;
    }

    var htmls = util.readFilesSync(vars.destRoot, /\.html$/),
        addr = 'http://' + util.vars.LOCAL_SERVER + ':' + config.localserver.port;

    if(htmls.length){
        addr = util.joinFormat(addr, path.relative(vars.destRoot, htmls[0]));
    }

    util.openBrowser(addr);
});
// - watch task

// + concat task
gulp.task('concat', function(){
    var iConfig = fn.taskInit();
    if(!iConfig){
        return;
    }
    if(!iConfig.concat){
        return;
    }


    var 
        events = [],
        concatHandle = function(dist, list){
            var iSrcs = [],
                iDirname = path.dirname(dist),
                iName = path.basename(dist);

            list.forEach(function(src){
                if(!fs.existsSync(src)){
                    util.msg.warn('concat src is not exist:', src);
                }
                iSrcs.push(util.joinFormat(src));
            });
            util.msg.info('concat target:', dist);
            util.msg.info('concat list:', iSrcs);


            var iStream = gulp.src(iSrcs, {basePath: iDirname})
                .pipe(concat(iName))
                .pipe(gulp.dest(iDirname));

            events.push(iStream);
        };

    for(var dist in iConfig.concat){
        if(iConfig.concat.hasOwnProperty(dist)){
            concatHandle(dist, iConfig.concat[dist]);
        }
    }

    return es.concat.apply(es, events);

});
// - concat task
// + rev
gulp.task('rev', function(done){
    runSequence('rev-clean', 'rev-loadRemote', 'rev-build', 'rev-remote-build', 'rev-dataInit', 'rev-replace', done);
});

gulp.task('rev-clean', function(){
    var 
        iConfig = fn.taskInit(),
        md5Filter = filter(function(file){
            return /-[a-zA-Z0-9]{10}\.?\w*\.\w+/.test(file.history);

        }, {restore: true}),
        vars = gulp.env.vars;

    if(!iConfig){
        return;
    }
     
    return gulp.src( util.joinFormat( vars.root, '**/*.*'), { base: util.joinFormat(vars.destRoot) })
            .pipe(plumber())
            .pipe(md5Filter)
            .pipe(clean({force: true}));
});

gulp.task('rev-loadRemote', function(done){
    var 
        iConfig = fn.taskInit();

    if(!iConfig){
        return;
    }

    var
        iVer = gulp.env.version,
        revAddr;

    if(!iVer){
        util.msg.info('rev-loadRemote finish, no version');
        return done();

    } else if(!iConfig.dest.revAddr){
        util.msg.info('rev-loadRemote finish, no config.commit.revAddr');
        return done();

    } else {
        if(iVer == 'remote'){
            revAddr = iConfig.commit.revAddr + '?' + (+new Date());

        } else {
            revAddr = iConfig.commit.revAddr.split('.json').join('-' + iVer + '.json');
        }

        fn.get(revAddr, function(data){
            try{
                cache.remoteRevData = JSON.parse(data);

            } catch(er){
                util.msg.warn('rev get fail');
            }

            done();
        });
    }
});

gulp.task('rev-build', function(){
    var 
        iConfig = fn.taskInit();

    if(!iConfig){
        return;
    }
    var 
        vars = gulp.env.vars;

    gulp.env.cssjsdate = util.makeCssJsDate();

    return gulp.src([
                util.joinFormat( vars.root, '**/*.*'), 
                '!' + util.joinFormat(vars.root, '**/*.html'), 
                '!' + util.joinFormat(vars.root, '**/assets/**/*.*')
            ], { 
                base: vars.revRoot
            })
            .pipe(rev())
            
            .pipe(gulp.dest(vars.root))
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
            .pipe(gulp.dest(vars.revDest))
            .pipe(rename({suffix: '-' + gulp.env.cssjsdate}))
            .pipe(gulp.dest(vars.revDest));
});

gulp.task('rev-remote-build', function(){
    var 
        iConfig = fn.taskInit(),
        vars = gulp.env.vars,
        md5Filter = filter(function(file){
            return !/-[a-zA-Z0-9]{10}\.?\w*\.\w+/.test(file.history);

        }, {restore: true});

    if(!iConfig ||!cache.remoteRevData){
        util.msg.info('rev-remote-build done, no remoteRevData');
        return;
    }
    
    return gulp.src([
                util.joinFormat( vars.root, '**/*.*'), 
                '!' + util.joinFormat(vars.root, '**/*.html'), 
                '!' + util.joinFormat(vars.root, '**/assets/**/*.*')
            ], { 
                base: vars.destRoot
            })
            .pipe(md5Filter)
            .pipe(
                through.obj(function(file, enc, next){
                    if(cache.remoteRevData){
                        var iPath = cache.remoteRevData[util.joinFormat(path.relative( vars.destRoot, file.path)) ];

                        if(iPath){
                            file.path = util.joinFormat( vars.destRoot, iPath) ;
                        }
                        this.push(file);

                    }

                    next();
                })
             )
            .pipe(gulp.dest(vars.destRoot));
            
});

gulp.task('rev-dataInit', function(done){
    var 
        iConfig = fn.taskInit(),
        vars = gulp.env.vars,
        revPath = util.joinFormat( vars.revDest, 'rev-manifest.json');

    if(!iConfig || !fs.existsSync(revPath)){
        return done();
    }

    

    cache.localRevData = util.requireJs(revPath);
    if(cache.remoteRevData){
        cache.localRevData = util.extend(cache.localRevData, cache.remoteRevData);
    }

    done();

});

gulp.task('rev-replace', function(){
    var 
        iConfig = fn.taskInit(),
        vars = gulp.env.vars;

    if(!iConfig || !cache.localRevData){
        return;
    }

    return gulp.src( util.joinFormat( vars.root, '**/*.+(html|js|css)'), { base: vars.destRoot })
            .pipe(plumber())
            .pipe(through.obj(function(file, enc, next){
                var iCnt = file.contents.toString();

                for(var key in cache.localRevData){
                    if(cache.localRevData.hasOwnProperty(key) && key != 'version'){
                        iCnt = iCnt.replace(new RegExp(key, 'g'), cache.localRevData[key]);
                    }
                }


                file.contents = new Buffer(iCnt, 'utf-8');
                this.push(file);
                next();
            }))
            .pipe(gulp.dest(vars.destRoot))
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
            .pipe(gulp.dest(vars.revDest))
            ;

});

gulp.task('rev-update', function(done){
    if(gulp.env.runAll){
        done();
    } else {
        runSequence('rev-loadRemote', 'rev-remote-build', 'rev-dataInit', 'rev-replace', done);
    }
});

gulp.task('rev-update-task', function(){

});
// - rev
// + all
gulp.task('all', function(done){
    var iConfig = fn.taskInit();
    if(!iConfig){
        return;
    }
    var vars = gulp.env.vars;

    gulp.env.runAll = true;
    util.msg.info('start clear dist file');

    util.removeFiles(vars.destRoot, function(){
        util.msg.info('clear dist file done');
        runSequence(['js', 'css', 'images', 'html'], 'concat', 'rev', 'all-done', done);
    });

});

gulp.task('all-done', function(){
    gulp.env.runAll = false;
});

gulp.task('watchAll', ['watch']);
// - all
gulp.task('connect-reload', function(){
    return util.livereload();
});
