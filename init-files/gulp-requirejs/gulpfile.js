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
    util = require('yyl-util'),

    sass = require('gulp-sass'), // sass compiler
    minifycss = require('gulp-minify-css'), // minify css files
    jshint = require('gulp-jshint'), // check js syntac
    uglify = require('gulp-uglify'), // uglify js files
    imagemin = require('gulp-imagemin'), // minify images
    rename = require('gulp-rename'), // rename the files
    replacePath = require('gulp-replace-path'), // replace the assets path
    requirejsOptimize = require('gulp-requirejs-optimize'), // requirejs optimizer which can combine all modules into the main js file
    inlinesource = require('gulp-inline-source'), // requirejs optimizer which can combine all modules into the main js file
    filter = require('gulp-filter'), // filter the specified file(s) in file stream
    gulpJade = require('gulp-jade'),
    plumber = require('gulp-plumber'),
    runSequence = require('run-sequence').use(gulp),
    prettify = require('gulp-prettify'),
    rev = require('gulp-rev'),
    override = require('gulp-rev-css-url'),
    clean = require('gulp-clean'),
    through = require('through2'),
    es = require('event-stream'),
    watch = require('gulp-watch'),

    cache = {
        remoteRevData: '',
        localRevData: ''
    },
    TASK_MAP = {
        'js': ['js-task', 'concat', 'rev-update'],
        'html': ['html-task', 'html-task-step02'],
        'css': ['css-component-task', 'css-base-task', 'css-dist', 'concat', 'rev-update'],
        'images': ['images-img', 'images-components', 'rev-update', 'rev-img-update'],
        'rev': ['rev-clean', 'rev-loadRemote', 'rev-build', 'rev-remote-build', 'rev-dataInit', 'rev-replace'],
        'rev-update': ['rev-loadRemote', 'rev-remote-build', 'rev-dataInit', 'rev-replace']
    },
    runQueue = function(){
        var 
            r = util.makeArray(arguments),
            deep = true,
            deepFn = function(){
                deep = false;
                var fr = [];
                r.forEach(function(item){
                    if(typeof item == 'string'){
                        if(TASK_MAP[item] && util.type(TASK_MAP[item]) == 'array'){
                            fr = fr.concat(TASK_MAP[item]);
                            deep = true;
                        } else {
                            fr.push(item);
                        }
                    } else {
                        fr.push(item);
                    }
                });
                r = fr;
            };
        while(deep){
            deepFn();
        }
        util.msg.info('runSequence', r);
        runSequence.apply(runSequence, r);

    };

require('colors');

var 
    config = require('./config.js'),
    localConfig = fs.existsSync('./config.mine.js')? require('./config.mine.js'): {};

config = util.initConfig(util.extend(true, config, localConfig));



var fn = {
    blankPipe: function() {
        return through.obj(function(file, enc, next) {
            next(null, file);
        });
    },
    relateDest: function(iPath) {
        return util.joinFormat(path.relative(gulp.env.vars.destRoot, iPath));
    },
    taskHelper: function(commands) {

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
                '  yyl ' + commands + ' --name <Project>',
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

var 
    iStream = {
        // + html task
        jade2html: function(stream, next){
            var 
                iConfig = fn.taskInit(),
                vars = gulp.env.vars;

            if(!iConfig){
                return;
            }
            var rStream = stream
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

                            if(iPath.match(/^(data:image|data:webp|javascript:|#|http:|https:|\/)/) || !iPath){
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
                .pipe(prettify({indent_size: 4}));
                // .pipe(gulp.dest(util.joinFormat(vars.srcRoot, 'html')))
            
            next(rStream);

        },
        html2dest: function(stream, next){
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
            var rStream = stream
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
                    if(Object.keys(copyPath).length){
                        util.msg.info('copy file start', copyPath);
                        util.copyFiles(copyPath, function(){
                            util.msg.success('copy file done');
                            next();
                        });

                    } else {
                        next();
                    }
                    
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
                .pipe(replacePath(/\.\.\/components\/p-[a-zA-Z0-9\-]+\/p-([a-zA-Z0-9\-]+).js/g, util.joinFormat( remotePath, fn.relateDest(vars.jsDest), '/$1.js')))


                .pipe(replacePath('../css', util.joinFormat( remotePath, fn.relateDest(vars.cssDest))))

                // 替换公用图片
                .pipe(replacePath('../images', util.joinFormat( remotePath, vars.imagesDest)))
                .pipe(replacePath(/\.\.\/(components\/[pwr]-[a-zA-Z0-9\-]+\/images)/g, util.joinFormat( remotePath, fn.relateDest(vars.imagesDest), '$1')))

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
                }));
                // .pipe(gulp.dest(vars.htmlDest));

            next(rStream);

        },
        // - html task
        // + css task
        sassBase2css: function(stream, next){
            var 
                rStream = stream
                    .pipe(plumber())
                    .pipe(sass({outputStyle: 'nested'}).on('error', sass.logError));
            next(rStream);

        },
        sassComponent2css: function(stream, next){
            var iConfig = fn.taskInit();
            if(!iConfig){
                return;
            }
            
            var vars = gulp.env.vars;
            
            var 
                rStream = stream
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

                            if(iPath.match(/^http[s]?\:/)){
                                return str;
                            }
                            if(iPath.match(/^\/\/\w/)){
                                return str;
                            }

                            
                            var fDirname = path.dirname(path.relative(dirname, file.path));
                            rPath = path.join(fDirname, iPath)
                                .replace(/\\+/g,'/')
                                .replace(/\/+/, '/')
                                .replace(/\?.*?$/g,'');

                            var rPath2 = path.join(dirname, iPath)
                                .replace(/\\+/g,'/')
                                .replace(/\/+/, '/')
                                .replace(/\?.*?$/g,'');

                            if(fs.existsSync(util.joinFormat(dirname, rPath))){ // 以当前文件所在目录为 根目录查找文件
                                return $1 + rPath + $3;

                            }else if(fs.existsSync(rPath2)){ // 如果直接是根据生成的 css 目录去匹配 也允许
                                return str;

                            } else {

                                util.msg.warn('css url replace error', path.basename(file.history.toString()));
                                util.msg.warn('    path not found', util.joinFormat(dirname, rPath));
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
                    }));

            next(rStream);
        },
        css2dest: function(stream, next){
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

            var 
                rStream = stream
                    .pipe(plumber())
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
                        if(Object.keys(copyPath).length){
                            util.copyFiles(copyPath, function(){
                                util.msg.success('copy file done');
                                next();
                            }, null, null, vars.dirname);

                        } else {
                            next();
                        }
                        
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
                    .pipe(gulp.env.isCommit?minifycss({
                        compatibility: 'ie7'
                    }): fn.blankPipe());
                    

            next(rStream);
        },
        // - css task
        // + image task
        image2dest: function(stream, next){
            var 
                rStream = stream
                    .pipe(plumber())
                    .pipe(filter(['**/*.jpg', '**/*.jpeg', '**/*.png', '**/*.bmp', '**/*.gif', '**/*.webp']))
                    .pipe(gulp.env.isCommit?imagemin({ optimizationLevel: 3, progressive: true, interlaced: true }): fn.blankPipe());

            next(rStream);
        },
        // - image task
        // + js task
        js2dest: function(stream, next){

        },
        // - js task
    };


// + html task
gulp.task('html', ['jade-to-dest-task', 'html-to-dest-task'], function(done){
    gulp.env.nowTask = 'html';
    done();

});

gulp.task('jade-to-dest-task', function(done){
    var 
        iConfig = fn.taskInit(),
        vars = gulp.env.vars;

    if(!iConfig){
        return;
    }
    
    new util.Promise(function(next){
        iStream.jade2html(
            gulp.src( 
                util.joinFormat(iConfig.alias.srcRoot, 'components/@(p-)*/*.jade')
            ),
            next
        );

    }).then(function(stream, next){
        iStream.html2dest(stream, next);

    }).then(function(stream){
        stream.pipe(gulp.dest(vars.htmlDest));
        done();

    }).start();

});

gulp.task('html-to-dest-task', function(done){
    var 
        iConfig = fn.taskInit(),
        vars = gulp.env.vars;

    if(!iConfig){
        return;
    }

    new util.Promise(function(next){
        iStream.html2dest(gulp.src(util.joinFormat(vars.srcRoot, 'html/*.html')), next);

    }).then(function(stream){
        stream.pipe(gulp.dest(vars.htmlDest));
        done();

    }).start();

});
// - html task

// + css task
gulp.task('css', ['sass-component-to-dest', 'sass-base-to-dest', 'css-to-dest'], function(done) {
    gulp.env.nowTask = 'css';
    runQueue('concat', 'rev-update', done);

});
gulp.task('sass-component-to-dest', function(done) {
    var iConfig = fn.taskInit();
    if(!iConfig){
        return;
    }
    
    var vars = gulp.env.vars;

    new util.Promise(function(next){
        iStream.sassComponent2css(gulp.src(
            path.join(vars.srcRoot,'components/@(p-)*/*.scss'), {
                base: path.join(vars.srcRoot)
            }
        ), next);

    }).then(function(stream, next){
        iStream.css2dest(stream, next);
    }).then(function(stream){
        stream.pipe(gulp.dest( util.joinFormat(vars.cssDest)));
        done();

    }).start();
});

gulp.task('sass-base-to-dest', function(done){
    var iConfig = fn.taskInit();
    if(!iConfig){
        return;
    }

    var vars = gulp.env.vars;

    new util.Promise(function(next){
        iStream.sassBase2css(gulp.src([
            util.joinFormat(vars.srcRoot, 'sass/**/*.scss'),
            '!' + util.joinFormat(vars.srcRoot, 'sass/base/**/*.*')
        ]), next);

    }).then(function(stream, next){
        iStream.css2dest(stream, next);
    }).then(function(stream){
        stream.pipe(gulp.dest( util.joinFormat(vars.cssDest)));
        done();

    }).start();

});

gulp.task('css-to-dest', function(done){
    var iConfig = fn.taskInit();
    if(!iConfig){
        return;
    }

    var vars = gulp.env.vars;

    new util.Promise(function(next){
        iStream.css2dest(
            gulp.src(path.join(vars.srcRoot, 'css', '**/*.css')),
            next
        );

    }).then(function(stream){
        stream.pipe(gulp.dest( util.joinFormat(vars.cssDest)));
        done();

    }).start();

});
// - css task

// + images task
gulp.task('images',['images-base-task', 'images-component-task'], function(done) {
    gulp.env.nowTask = 'images';
    runQueue('rev-update', 'rev-img-update', done);
});

gulp.task('images-base-task', function(done) {
    var iConfig = fn.taskInit();
    if(!iConfig){
        return;
    }
    var vars = gulp.env.vars;

    new util.Promise(function(next){
        iStream.image2dest(gulp.src([ util.joinFormat( vars.srcRoot, 'images/**/*.*')], {base: util.joinFormat( vars.srcRoot, 'images')}), next);

    }).then(function(stream){
        stream.pipe(gulp.dest( util.joinFormat(vars.imagesDest)));
        done();

    }).start();

});
gulp.task('images-component-task', function(done){
    var iConfig = fn.taskInit();
    if(!iConfig){
        return;
    }

    var 
        vars = gulp.env.vars;

    new util.Promise(function(next){
        iStream.image2dest(gulp.src([
            util.joinFormat( vars.srcRoot, 'components/**/*.*')
        ], {
            base: util.joinFormat( vars.srcRoot, 'components')
        }), next);

    }).then(function(stream){
        stream.pipe(gulp.dest( util.joinFormat( vars.imagesDest, 'components')));
        done();

    }).start();

});
// - images task

// + js task
gulp.task('js', function (done) {
    gulp.env.nowTask = 'js';
    runQueue('js-task', 'concat', 'rev-update', done);
});
gulp.task('js-task', function () {
    var iConfig = fn.taskInit();
    if(!iConfig){
        return;
    }

    /* requirejs 主模块列表 & 页面js [start] */
    var 
        rjsFilter = filter(function (file) {
            var result = /([pj]\-[a-zA-Z0-9\-_]*)[\\\/]([pj]\-[a-zA-Z0-9\-_]*)\.js$/.test(file.path);
            if(result){
                file.base = util.joinFormat(file.path.replace(/([pj]\-[a-zA-Z0-9\-_]*)\.js$/, ''));
            }
            return result;
        });
    /* requirejs 主模块列表 & 页面js [end] */
    var
        vars = gulp.env.vars;

    // jsTask
    var
        jsStream = gulp.src(path.join(vars.srcRoot, 'components/**/*.js'))
            .pipe(plumber())
            .pipe(jshint.reporter('default'))
            .pipe(rjsFilter)
            .pipe(jshint())
            /* 合并主文件中通过 requirejs 引入的模块 [start] */
            .pipe(requirejsOptimize({
                optimize: 'none',
                mainConfigFile: util.joinFormat(vars.srcRoot, 'js/rConfig/rConfig.js')
            }))
            .pipe(gulp.env.isCommit?uglify(): fn.blankPipe())
            .pipe(rename(function(path) {
                path.basename = path.basename.replace(/^[pj]-/g, '');
                path.dirname = '';
            }))
            .pipe(gulp.dest(util.joinFormat(vars.jsDest)));

    // js lib Task
    var 
        jsLibStream = gulp.src(util.joinFormat( vars.srcRoot, 'js/lib/**/*.js'))
            .pipe(plumber())
            .pipe(gulp.env.isCommit?uglify():fn.blankPipe())
            .pipe(gulp.dest( vars.jslibDest ));

    var
        jsDataStream = gulp.src([util.joinFormat(vars.srcRoot, 'js/**/*.json')])
            .pipe(plumber())
            .pipe(gulp.dest( vars.jsDest ));

    var 
        jsBaseStream = gulp.src([
                util.joinFormat(vars.srcRoot, 'js/**/*.js'),
                '!' + util.joinFormat(vars.srcRoot, 'js/lib/**'),
                '!' + util.joinFormat(vars.srcRoot, 'js/widget/**')
            ])
        .pipe(plumber())
        /* 合并主文件中通过 requirejs 引入的模块 [start] */
        .pipe(requirejsOptimize({
            optimize: 'none',
            mainConfigFile: util.joinFormat(vars.srcRoot, 'js/rConfig/rConfig.js')
        }))
        .pipe(gulp.env.isCommit?uglify(): fn.blankPipe())
        .pipe(gulp.dest(util.joinFormat(vars.jsDest)));

    return es.concat.apply(es, [jsStream, jsLibStream, jsBaseStream, jsDataStream]);
});
// - js task

// + concat task
gulp.task('concat', function(done){
    var iConfig = fn.taskInit();
    if(!iConfig){
        return;
    }
    if(!iConfig.concat){
        return;
    }
    

    var iCmd = [
        'yyl supercall concat',
        util.envStringify({
            name: gulp.env.name,
            ver: gulp.env.ver,
            debug: gulp.env.debug,
            slient: gulp.env.slient,
            proxy: gulp.env.proxy
        })
    ].join(' ');

    util.msg.info('run cmd:', iCmd);
    util.runCMD(iCmd, function(){
        done();
    });

});
// - concat task

// + resource
gulp.task('resource', function(){
    var iConfig = fn.taskInit();
    if(!iConfig){
        return;
    }

    if(iConfig.resource){
        var streams = [],
            i = 0;

        for(var key in iConfig.resource){
            if(iConfig.resource.hasOwnProperty(key) && fs.existsSync(key)){
                streams[i++] = gulp.src(path.join(key, '**/*.*')).pipe(gulp.dest(iConfig.resource[key]));
            }
        }

        return streams.length? es.concat.apply(es, streams): null;
    }

});
// - resource


// + rev
gulp.task('rev', function(done){
    var 
        iConfig = fn.taskInit();

    if(!iConfig){
        return done();
    }
    if(!iConfig.commit.revAddr){
        util.msg.warn('config.commit.revAddr not set, rev task not run');
        return done();
    }
    runQueue('rev-clean', 'rev-loadRemote', 'rev-build', 'rev-remote-build', 'rev-dataInit', 'rev-replace', done);
});

gulp.task('rev-clean', function(){
    var 
        iConfig = fn.taskInit(),
        md5Filter = filter(function(file){
            return /-[a-zA-Z0-9]{10}\.?\w*\.\w+$/.test(file.history) && 
                fs.existsSync((file.history + '').replace(/-[a-zA-Z0-9]{10}(\.?\w*\.\w+$)/, '$1'));

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

    } else if(!iConfig.commit.revAddr){
        util.msg.info('rev-loadRemote finish, no config.commit.revAddr');
        return done();

    } else {
        if(iVer == 'remote'){
            revAddr = iConfig.commit.revAddr + '?' + (+new Date());

        } else {
            revAddr = iConfig.commit.revAddr.split('.json').join('-' + iVer + '.json');
        }

        util.get(revAddr, function(data){
            try{
                cache.remoteRevData = JSON.parse(data);
                util.msg.success('rev get success');

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

    if(!iConfig.commit.revAddr){
        util.msg.warn('config.commit.revAddr not set, rev-build task not run');
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
            .pipe(override())
            .pipe(gulp.dest(vars.revRoot))
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

    if(!iConfig.commit.revAddr){
        util.msg.warn('config.commit.revAddr not set, rev-remote-build task not run');
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

    if(!iConfig.commit.revAddr){
        util.msg.warn('config.commit.revAddr not set, rev-dataInit task not run');
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

    if(!iConfig.commit.revAddr){
        util.msg.warn('config.commit.revAddr not set, rev-replace task not run');
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
    var 
        iConfig = fn.taskInit();

    if(!iConfig){
        return done();
    }

    if(!iConfig.commit.revAddr){
        util.msg.warn('config.commit.revAddr not set, rev-update task not run');
        return done();
    }

    if(gulp.env.runAll){
        done();
    } else {
        runQueue('rev-loadRemote', 'rev-remote-build', 'rev-dataInit', 'rev-replace', done);
    }
});

gulp.task('rev-img-update', function(){
    var 
        iConfig = fn.taskInit(),
        vars = gulp.env.vars;

    if(!iConfig || !cache.localRevData){
        return;
    }

    if(!iConfig.commit.revAddr){
        util.msg.warn('config.commit.revAddr not set, rev-img-update task not run');
        return;
    }

    return gulp.src( util.joinFormat( vars.imagesDest, '**/*.+(jpg|png|bmp|gif|jpeg|webp)'), { base: vars.revRoot })
            .pipe(plumber())
            .pipe(rename(function(p){
                var iPath = util.joinFormat(p.dirname, p.basename + p.extname);

                if(cache.localRevData && cache.localRevData[iPath]){
                    p.basename = path.basename(cache.localRevData[iPath]).replace(p.extname, '');
                }
            }))
            .pipe(gulp.dest(vars.revRoot));
});

gulp.task('rev-update-task', function(){

});
// - rev




// + watch task
gulp.task('watch', ['all'], function() {
    var iConfig = fn.taskInit();
    if(!iConfig){
        return;
    }
    var vars = gulp.env.vars;


    // 看守所有.scss档
    watch( util.joinFormat( vars.srcRoot, '**/*.scss'), util.debounce(function(){
        util.taskQueue.add('css', function(next){
            runQueue('css', 'html', 'concat', function(){
                util.livereload();
                util.msg.success('css task done');
                if(!gulp.env.silent){
                    util.pop('css task done');
                }
                next();
            });

        }, 200);
    }, 500));

    // 看守所有.js档
    watch([
        util.joinFormat(vars.srcRoot, 'components/**/*.js'),
        util.joinFormat(vars.srcRoot, 'js/lib/**/*.js'),
        util.joinFormat(vars.commons, '**.*.js')
    ], util.debounce(function(){
        util.taskQueue.add('js', function(next){
            runQueue('js-task', 'html-task', 'html-task-step02', 'concat', 'rev-update', function(){
                util.livereload();
                util.msg.success('js task done');
                if(!gulp.env.silent){
                    util.pop('js task done');
                }
                next();
            });

        }, 200);
    }, 500));

    // 看守所有图片档
    watch([
        util.joinFormat(vars.srcRoot, 'images/*.*'),
        util.joinFormat(vars.srcRoot, 'components/**/images/*.*'),
        util.joinFormat(vars.globalcomponents, '**/images/*.')
    ], util.debounce(function(){
        util.taskQueue.add('images', function(next){
            runQueue('images', 'html', function(){
                util.livereload();
                util.msg.success('images task done');
                if(!gulp.env.silent){
                    util.pop('images task done');
                }
                next();
            });
        }, 200);

    }, 500));

    // 看守所有jade 文件
    watch([
        util.joinFormat(vars.srcRoot, 'components/**/*.jade'),
        util.joinFormat(vars.srcRoot, 'templates/**/*.jade'),
        util.joinFormat(vars.globalcomponents, '**/*.jade')
    ], util.debounce(function(){
        util.taskQueue.add('html', function(next){
            runQueue('html', function(){
                util.livereload();
                util.msg.success('jade task done');
                if(!gulp.env.silent){
                    util.pop('jade task done');
                }
                next();
            });

        }, 200);
    }, 500));

    // 看守所有 resource 定义的文件
    if(iConfig.resource){
        watch(Object.keys(iConfig.resource).map(function(src){
            return path.join(src, '**/*.*');

        }), util.debounce(function(){
            util.taskQueue.add('resource', function(next){
                runQueue('resource', function(){
                    util.livereload();
                    util.msg.success('resource task done');
                    if(!gulp.env.silent){
                        util.pop('resource task done');
                    }
                    next();
                });

            }, 200);

        }, 500));


    }

    util.livereload();

    var iCmd = [
        'yyl supercall watchDone',
        util.envStringify({
            name: gulp.env.name,
            ver: gulp.env.ver,
            debug: gulp.env.debug,
            slient: gulp.env.slient,
            proxy: gulp.env.proxy
        })
    ].join(' ');

    util.msg.info('run cmd:', iCmd);
    util.runCMD(iCmd);
});
// - watch task

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
        runQueue(['js', 'css', 'images', 'html', 'resource'], 'concat', 'rev', 'all-done', function(){
            if(!gulp.env.silent){
                util.pop('all task done');
            }
            done();
        });
    });
});

gulp.task('all-done', function(){
    gulp.env.runAll = false;
});

gulp.task('watchAll', ['watch']);
// - all
