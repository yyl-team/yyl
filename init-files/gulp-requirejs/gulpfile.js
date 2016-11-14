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
    requirejsOptimize = require('gulp-requirejs-optimize'), // requirejs optimizer which can combine all modules into the main js file
    inlinesource = require('gulp-inline-source'), // requirejs optimizer which can combine all modules into the main js file
    filter = require('gulp-filter'), // filter the specified file(s) in file stream
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

config = util.extend(true, config, localConfig);



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
            return iConfig;
        }

    }
};

// + config 内变量替换
(function(){
    var 
        ctxRender = function(ctx, vars){
            vars = vars || {};
            ctx = util.joinFormat(ctx.replace(/\{\$(\w+)\}/g, function(str, $1){
                return vars[$1] || '';
            }));
            return ctx;
        },
        iForEach = function(arr, vars){
            for(var i = 0, len = arr.length; i < len; i++){
                switch(util.type(arr[i])){
                    case 'array':
                        arr[i] = iForEach(arr[i], vars);
                        break;

                    case 'string':
                        arr[i] = ctxRender(arr[i], vars);
                        break;

                    case 'object':
                        if(arr[i] !== null){
                            arr[i] = deep(arr[i], vars);
                        }
                        break;
                    case 'function':
                        break;

                    default:
                        break;
                }
            }
            return arr;
        },
        deep = function(obj, vars){
            var newKey;
            for(var key in obj){
                if(obj.hasOwnProperty(key)){
                    switch(util.type(obj[key])){
                        case 'array':
                            newKey = ctxRender(key);
                            if(newKey != key){
                                obj[newKey] = iForEach(obj[key], vars);
                                delete obj[key];

                            } else {
                                obj[key] = iForEach(obj[key], vars);

                            }
                            break;

                        case 'object':
                            newKey = ctxRender(key);
                            if(newKey != key){
                                obj[newKey] = deep(obj[key], vars);
                                delete obj[key];

                            } else {
                                obj[key] = deep(obj[key], vars);

                            }
                            break;

                        case 'string':
                            obj[key] = ctxRender(obj[key], vars);
                            break;

                        case 'function':
                            break;

                        default:
                            break;
                    }
                }
            }
            return obj;

        };

    // 判断是单个 config 还是 多项目 config
    var useful = false; 
    if(!config.alias && !config.localserver){
        for(var key in config){
            if(util.type(config[key]) == 'object' && config[key].alias && config[key].localserver){
                config[key] = deep(config[key], config[key].alias);
                useful = true;
            }
        }
    } else if(config.alias && config.localserver){
        config = deep(config, config.alias);
        useful = true;
    }

    if(!useful){
        util.msg.error('useness config file', 'please check');
        process.exit();
    }

})();
// - config 内变量替换

// + html task
gulp.task('html', function(done){
    gulp.env.nowTask = 'html';
    // runSequence('html-task', 'rev-update', done);
    runSequence('html-task', done);

});
gulp.task('html-task', function(){
    var 
        iConfig = fn.taskInit();

    if(!iConfig){
        return;
    }
    var 
        events = [],
        vars = gulp.env.vars,
        relateHtml = function(iPath){
            return util.joinFormat(
                path.relative(
                    path.join(gulp.env.vars.srcRoot, 'html'),
                    iPath
                )
            );
        },
        remotePath = gulp.env.ver == 'remote' || gulp.env.isCommit? iConfig.commit.hostname: '/',
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

    events.push(tmplStream);

    // html task
    var htmlStream = gulp.src( util.joinFormat(vars.srcRoot, 'html/*.html'))
        .pipe(plumber())
        .pipe(inlinesource())
        // 删除requirejs的配置文件引用
        .pipe(replacePath(/<script [^<]*local-usage\><\/script>/g, ''))

        // 替换全局 图片
        .pipe(replacePath(
            relateHtml(path.join(__dirname, vars.globalcomponents)),
            util.joinFormat(remotePath, fn.relateDest(vars.imageDest), 'globalcomponents')
        ))
        // 替换 common 下 lib
        .pipe(replacePath(
            relateHtml(path.join(__dirname, vars.globallib)),
            util.joinFormat(remotePath, fn.relateDest(vars.jslibDest), 'globallib')
        ))
        // 替换 jslib
        .pipe(replacePath('../js/lib', util.joinFormat(remotePath, fn.relateDest(vars.jslibDest))))
        // 替换 js
        .pipe(replacePath('../js', util.joinFormat(remotePath, fn.relateDest(vars.jsDest))))
        // 替换 components 中的js
        .pipe(replacePath(/\.\.\/components\/p-\w+\/p-(\w+).js/g, util.joinFormat( remotePath, fn.relateDest(vars.jsDest), '/$1.js')))


        .pipe(replacePath('../css', util.joinFormat( remotePath, fn.relateDest(vars.cssDest))))

        .pipe(replacePath('../images', util.joinFormat( remotePath, vars.imageDest)))
        .pipe(replacePath(/\.\.\/(components\/[pw]-\w+\/images)/g, util.joinFormat( remotePath, fn.relateDest(vars.imageDest), '$1')))
        // .pipe(replacePath('../images', + assetsPath.images))
        .pipe(gulp.dest(vars.htmlDest));

    events.push(htmlStream);

    return es.concat.apply(es, events);
});
// - html task

// + css task
gulp.task('css', function(done) {
    gulp.env.nowTask = 'css';
    // runSequence('css-task', 'concat', 'rev-update', done);
    runSequence('css-task', done);

});

gulp.task('css-task', function() {
    var iConfig = taskInit();
    if(!iConfig){
        return;
    }
    var vars = gulp.env.vars,
        remotePath = gulp.env.ver == 'remote' || gulp.env.isCommit? iConfig.commit.hostname: '/',
        relateCss = function(iPath){
            return util.joinFormat(
                path.relative(
                    path.join(vars.srcRoot, 'css'),
                    iPath
                )
            );

        };
    return gulp.src(path.join(vars.srcRoot,'components/@(p-)*/*.scss'), {base: path.join(vars.srcRoot)})
        .pipe(sass({outputStyle: 'nested'}).on('error', sass.logError))
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
        .pipe(gulp.dest(path.join(vars.srcRoot, 'css')))
        // 替换全局 图片
        .pipe(replacePath(
            relateCss(vars.globalcomponents),
            // remotePath
            path.joinFormat(remotePath, vars.imageDest, 'globalcomponents')
        ))

        .pipe(replacePath('../images', util.joinFormat(remotePath, vars.imageDest)))
        .pipe(replacePath('../components', util.joinFormat( remotePath, vars.imageDest, 'components')))
        .pipe(iConfig.isCommit?minifycss({
            compatibility: 'ie7'
        }): fn.blankPipe())

        .pipe(gulp.dest( util.joinFormat(vars.cssDest)));
    // process.chdir( path.joinFormat(__dirname, iConfig.src, 'components'));
    // return sass('./', { style: 'nested', 'compass': true })
    //     .pipe(filter('@(p-)*/*.css'))
    //     .pipe(through.obj(function(file, enc, next){
    //         var iCnt = file.contents.toString();
    //         var pathReg = /(url\s*\(['"]?)([^'"]*?)(['"]?\s*\))/ig;
    //         var pathReg2 = /(src\s*=\s*['"])([^'" ]*?)(['"])/ig;
    //         var dirname = path.joinFormat(__dirname, iConfig.src, 'css');

    //         var replaceHandle = function(str, $1, $2, $3){
    //             var iPath = $2,
    //                 rPath = '';

    //             if(iPath.match(/^(about:|data:)/)){
    //                 return str;
    //             }

    //             var fDirname = path.dirname(path.relative(dirname, file.path));
    //             rPath = path.join(fDirname, iPath)
    //                 .replace(/\\+/g,'/')
    //                 .replace(/\/+/, '/')
    //                 ;
    //             if(fs.existsSync(path.joinFormat(dirname, rPath).replace(/\?.*?$/g,''))){
    //                 return $1 + rPath + $3;

    //             } else {

    //                 console.log(([
    //                     '',
    //                     '[error] css url replace error!',
    //                     file.history,
    //                     '[' + rPath + '] is not found!'].join("\n")
    //                 ).yellow);
    //                 return str;
    //             }

    //         };


    //         iCnt = iCnt
    //             .replace(pathReg, replaceHandle)
    //             .replace(pathReg2, replaceHandle);

    //         file.contents = new Buffer(iCnt, 'utf-8');
    //         this.push(file);
    //         next();
    //     }))
    //     .pipe(rename(function(path){
    //         path.dirname = '';
    //         path.basename = path.basename.replace(/^p-/,'');
    //     }))
    //     .pipe(gulp.dest('../css/'))
    //     // 替换全局 图片
    //     .pipe(replacePath(
    //         path.joinFormat(
    //             path.relative(
    //                 path.join(__dirname, iConfig.src, 'css'),
    //                 path.join(__dirname, iConfig.global.components)
    //             )
    //         ),
    //         path.joinFormat(iConfig.dest.hostname, iConfig.dest.path.images, 'globalcomponents')
    //     ))

    //     .pipe(replacePath('../images', path.joinFormat(iConfig.dest.hostname, iConfig.dest.path.images)))
    //     .pipe(replacePath('../components', path.joinFormat(iConfig.dest.hostname, iConfig.dest.path.images, 'components')))
    //     .pipe(iConfig.isCommit?minifycss({
    //         compatibility: 'ie7'
    //     }): fn.blankPipe())

    //     .pipe(gulp.dest( path.joinFormat(__dirname, 'dist', iConfig.dest.path.css)))
    //     // .pipe(notify({ message: 'CSS task complete' }))
    //     .pipe(livereload({quiet: true}))
    //     ;
});
// - css task
