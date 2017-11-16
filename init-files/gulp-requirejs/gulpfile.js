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
    requirejs = require('requirejs'),
    inlinesource = require('gulp-inline-source'), // requirejs optimizer which can combine all modules into the main js file
    filter = require('gulp-filter'), // filter the specified file(s) in file stream
    gulpJade = require('gulp-jade'),
    plumber = require('gulp-plumber'),
    runSequence = require('run-sequence').use(gulp),
    prettify = require('gulp-prettify'),
    through = require('through2'),
    es = require('event-stream'),
    watch = require('gulp-watch');

require('colors');

util.msg.init({
    type: {
        optimize: {name: 'Optimize', color: 'green'},
        update: {name: 'Updated', color: 'cyan'}

    }
});

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

    },
    supercall: function(cmd, done){
        var iCmd = [
            'yyl supercall ' + cmd,
            util.envStringify({
                name: gulp.env.name,
                ver: gulp.env.ver,
                debug: gulp.env.debug,
                silent: gulp.env.silent,
                proxy: gulp.env.proxy
            })
        ].join(' ');

        util.msg.info('run cmd:', iCmd);
        util.runCMD(iCmd, function(){
            return done && done();
        });
    },
    srcRelative:  function(files, op){
        var iPaths;
        var iBase = op.base;
        if(util.type(files) != 'array'){
            iPaths = [files];
        } else {
            iPaths = files;
        }

        var 
            friendship = {
                scss: function(iPath){
                    var sourceFiles = util.readFilesSync(iBase, /\.scss/);

                    iPath = util.joinFormat(iPath);

                    if(~sourceFiles.indexOf(iPath)){ //排除当前文件
                        sourceFiles.splice(sourceFiles.indexOf(iPath), 1);
                    }

                    var r = [];

                    if(/p\-\w+\/p\-\w+\.scss/.test(iPath)){ // 如果自己是 p-xx 文件 也添加到 返回 array
                        r.push(iPath);
                    }

                    // 查找 文件当中 有引用当前 地址的
                    sourceFiles.forEach(function(iSource){
                        var iCnt = fs.readFileSync(iSource).toString();
                        iCnt.replace(/\@import ["']([^'"]+)['"]/g, function(str, $1){
                            var myPath = util.joinFormat(path.dirname(iSource), $1 + (path.extname($1)?'': '.scss'));
                            if(util.joinFormat(iPath) == myPath){
                                r.push(iSource);
                            }
                            return str;

                        });
                    });

                    return r;
                },
                jade: function(iPath){
                    var sourceFiles = util.readFilesSync(iBase, /\.jade$/);
                    iPath = util.joinFormat(iPath);

                    if(~sourceFiles.indexOf(iPath)){ // 排除当前文件
                        sourceFiles.splice(sourceFiles.indexOf(iPath), 1);
                    }

                    var r = [];

                    if(/p\-\w+\/p\-\w+\.jade$/.test(iPath)){ // 如果自己是 p-xx 文件 也添加到 返回 array
                        r.push(iPath);
                    }

                    // 查找 文件当中 有引用当前 地址的
                    sourceFiles.forEach(function(iSource){
                        var iCnt = fs.readFileSync(iSource).toString();
                        iCnt.replace(/(extends|include) ([^\ \r\n\t]+)/g, function(str, $1, $2){
                            var myPath = util.joinFormat(path.dirname(iSource), $2 + '.jade');
                            if(util.joinFormat(iPath) == myPath){
                                r.push(iSource);
                            }
                            return str;

                        });
                    });

                    return r;


                },
                js: function(iPath){
                    var sourceFiles = util.readFilesSync(iBase, /\.js/);
                    iPath = util.joinFormat(iPath);

                    if(~sourceFiles.indexOf(iPath)){ // 排除当前文件
                        sourceFiles.splice(sourceFiles.indexOf(iPath), 1);
                    }

                    var r = [];

                    if(/p\-\w+\/p\-\w+\.js/.test(iPath)){ // 如果自己是 p-xx 文件 也添加到 返回 array
                        r.push(iPath);
                    }
                    // 如果是 lib 里面的 js 也返回到当前 array
                    if(op.jslib && op.jslib == iPath.substring(0, op.jslib.length)){
                        r.push(iPath);
                    }

                    var rConfig = {};
                    if(op.rConfig && fs.existsSync(op.rConfig)){
                        try {
                            rConfig = require(op.rConfig);
                            rConfig = rConfig.paths;
                        } catch(er){}

                    }

                    var 
                        var2Path = function(name, dirname){
                            var rPath = rConfig[name];
                            if(rPath){
                                return util.joinFormat(path.dirname(op.rConfig), rPath + (path.extname(rPath)? '': '.js'));
                            } else {
                                rPath = name;
                                return util.joinFormat(dirname, name + (path.extname(rPath)? '': '.js'));
                            }

                        };

                    // 查找 文件当中 有引用当前 地址的
                    sourceFiles.forEach(function(iSource){
                        var iCnt = fs.readFileSync(iSource).toString();
                        iCnt.replace(/require\s*\(\s*["']([^'"]+)['"]/g, function(str, $1){ // require('xxx') 模式
                            var myPath = var2Path($1, iSource.dirname);
                            if(util.joinFormat(iPath) == myPath){
                                r.push(iSource);
                            }

                            return str;
                        }).replace(/require\s*\(\s*(\[[^\]]+\])/g, function(str, $1){ // require(['xxx', 'xxx']) 模式
                            var iMatchs = new Function('return ' + $1)();

                            iMatchs.forEach(function(name){
                                var myPath = var2Path(name, path.dirname(iSource));
                                if(util.joinFormat(iPath) == myPath){
                                    r.push(iSource);
                                }
                            });

                            return str;

                        });
                    });

                    return r;


                },
                other: function(iPath){ // 检查 html, css 当中 是否有引用
                    return [iPath];
                    // iPath = util.joinFormat(iPath);
                    // var r = [];

                    // var htmlFiles = util.readFilesSync(iBase, /\.html$/);
                    // var scriptReg = /(<script[^>]*>)([\w\W]*?)(<\/script\>)/ig;
                    // var pathReg = /(src|href|data-main|data-original)\s*=\s*(['"])([^'"]*)(["'])/ig;

                    // // 查找 文件当中 有引用当前 地址的
                    // htmlFiles.forEach(function(iSource){
                    //     var iCnt = fs.readFileSync(iSource).toString();
                    //     iCnt// 隔离 script 内容
                    //         .replace(scriptReg, function(str, $1, $2, $3){
                    //             return $1 + querystring.escape($2) + $3;
                    //         })
                    //         .replace(pathReg, function(str, $1, $2, $3){
                    //             var iPath = $3;
                    //             if(iPath.match(/^(data:image|data:webp|javascript:|#|http:|https:|\/)/) || !iPath){
                    //                 return;
                    //             }

                    //             // TODO iPath is the matched url

                    //         });
                    // });

                    // var cssFiles = util.readFilesSync(iBase, /\.css/);
                    // // 查找 文件当中 有引用当前 地址的
                    // cssFiles.forEach(function(iSource){
                    //     var iCnt = fs.readFileSync(iSource).toString();

                    //     var pathReg = /(url\s*\(['"]?)([^'"]*?)(['"]?\s*\))/ig;
                    //     var pathReg2 = /(src\s*=\s*['"])([^'" ]*?)(['"])/ig;

                    //     var replaceHandle = function(str, $1, $2){
                    //         var iPath = $2;

                    //         if(iPath.match(/^(about:|data:)/)){
                    //             return;
                    //         }

                    //         if(iPath.match(/^http[s]?\:/)){
                    //             return str;
                    //         }

                    //         // TODO iPath is the matched url;


                    //     };


                    //     iCnt.replace(pathReg, replaceHandle)
                    //         .replace(pathReg2, replaceHandle);
                    // });

                    // return r;

                }

            };

        var r = [];


        iPaths.forEach(function(iPath){
            var iExt = path.extname(iPath).replace(/^\./, '');
            var handle;
            switch(iExt){
                case 'scss':
                    handle = friendship.scss;
                    break;

                case 'jade':
                    handle = friendship.jade;
                    break;

                case 'js':
                    handle = friendship.js;
                    break;

                default:
                    handle = friendship.other;
                    break;
            }

            r = r.concat(handle(iPath));
        });
        return r;

    },
    pathInside: function(relPath, targetPath){
        return !/^\.\.\//.test(util.joinFormat(path.relative(relPath, targetPath)));
    },
    isImage: function(iPath){
        return /^\.(jpg|jpeg|bmp|gif|webp|png)$/.test(path.extname(iPath));
    }
};

var 
    iStream = {
        // + html task
        jade2html: function(stream){
            var 
                iConfig = fn.taskInit(),
                vars = gulp.env.vars;

            if(!iConfig){
                return;
            }
            var rStream = stream
                .pipe(plumber())
                .pipe(through.obj(function(file, enc, next){
                    util.msg.optimize('jade', file.relative);
                    this.push(file);
                    next();
                }))
                .pipe(gulpJade({
                    pretty: false,
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
            
            return rStream;

        },
        html2dest: function(stream){
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
                .pipe(replacePath('../images', util.joinFormat( remotePath, fn.relateDest(vars.imagesDest))))
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

            return rStream;

        },
        jade2dest: function(stream){
            var 
                rStream = iStream.jade2html(stream);

            rStream = iStream.html2dest(rStream);
            return rStream;
        },
        // - html task
        // + css task
        sassBase2css: function(stream){
            var 
                rStream = stream
                    .pipe(plumber())
                    .pipe(sass({outputStyle: 'nested'}).on('error', sass.logError));
            return rStream;

        },
        sassComponent2css: function(stream){
            var iConfig = fn.taskInit();
            if(!iConfig){
                return;
            }
            
            var vars = gulp.env.vars;
            
            var 
                rStream = stream
                    .pipe(through.obj(function(file, enc, next){
                        util.msg.optimize('sass', file.relative);
                        this.push(file);
                        next();
                    }))
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

            return rStream;
        },
        css2dest: function(stream){
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
                    
            return rStream;
        },
        sassComponent2dest: function(stream){
            var rStream;
            rStream = iStream.sassComponent2css(stream);
            rStream = iStream.css2dest(rStream);

            return rStream;
        },
        sassBase2dest: function(stream){
            var rStream;
            rStream = iStream.sassBase2css(stream);
            rStream = iStream.css2dest(rStream);

            return rStream;
        },
        // - css task
        // + image task
        image2dest: function(stream){
            var 
                rStream = stream
                    .pipe(plumber())
                    
                    .pipe(filter(['**/*.jpg', '**/*.jpeg', '**/*.png', '**/*.bmp', '**/*.gif', '**/*.webp']))
                    .pipe(through.obj(function(file, enc, next){
                        util.msg.optimize('img ', file.relative);
                        this.push(file);
                        next();
                    }))
                    .pipe(gulp.env.isCommit?imagemin({ optimizationLevel: 3, progressive: true, interlaced: true }): fn.blankPipe());

            return rStream;
        },
        // - image task
        // + js task
        requirejs2dest: function(stream){
            var iConfig = fn.taskInit();
            if(!iConfig){
                return;
            }
            var vars = gulp.env.vars;

            var rStream = stream
                    .pipe(filter('**/*.js'))
                    .pipe(plumber())
                    .pipe(jshint.reporter('default'))
                    .pipe(jshint())
                    .pipe(through.obj(function(file, enc, cb){
                        var 
                            self = this,
                            optimizeOptions = {
                                mainConfigFile: util.joinFormat(vars.srcRoot, 'js/rConfig/rConfig.js'),
                                logLevel: 2,
                                baseUrl: path.dirname(util.joinFormat(vars.srcRoot, file.relative)),
                                generateSourceMaps: false,
                                optimize: 'none',
                                include: util.joinFormat(path.relative(util.joinFormat(vars.srcRoot, 'js/rConfig'), util.joinFormat(vars.srcRoot, file.relative))),
                                out: function(text){
                                    file.contents = new Buffer(text, 'utf-8');
                                    self.push(file);
                                    cb();
                                }
                            };

                        util.msg.optimize('js  ', file.relative);

                        requirejs.optimize(optimizeOptions, null, function(err) {
                            if(err){
                                util.msg.error('Optimize js error', file.relative);
                                util.msg.error(err);
                            }
                            cb();
                        });

                    }))
                    .pipe(gulp.env.isCommit?uglify(): fn.blankPipe())
                    .pipe(rename(function(path){
                        path.basename = path.basename.replace(/^[pj]-/g,'');
                        path.dirname = '';
                    }));
            return rStream;
        },
        js2dest: function(stream){
            var 
                rStream = stream
                    .pipe(plumber())
                    .pipe(gulp.env.isCommit?uglify():fn.blankPipe());

            return rStream;

        },
        // - js task
        // + rev task
        relative2dest: function(){

        },
        revupdate: function(){

        }
        // - rev task
    };


// + html task
gulp.task('html', ['jade-to-dest-task', 'html-to-dest-task'], function(){
});

gulp.task('jade-to-dest-task', function(){
    var 
        iConfig = fn.taskInit(),
        vars = gulp.env.vars;

    if(!iConfig){
        return;
    }
    var rStream;

    rStream = iStream.jade2dest(gulp.src(util.joinFormat(iConfig.alias.srcRoot, 'components/@(p-)*/*.jade')));
    rStream = rStream.pipe(gulp.dest(vars.htmlDest));

    return rStream;

});

gulp.task('html-to-dest-task', function(){
    var 
        iConfig = fn.taskInit(),
        vars = gulp.env.vars;

    if(!iConfig){
        return;
    }
    var rStream;

    rStream = iStream.html2dest(gulp.src(util.joinFormat(vars.srcRoot, 'html/*.html')));
    rStream = rStream.pipe(gulp.dest(vars.htmlDest));

    return rStream;

});
// - html task

// + css task
gulp.task('css', ['sass-component-to-dest', 'sass-base-to-dest', 'css-to-dest'], function(done) {
    runSequence('concat', done);

});
gulp.task('sass-component-to-dest', function() {
    var iConfig = fn.taskInit();
    if(!iConfig){
        return;
    }
    
    var vars = gulp.env.vars;
    var rStream;

    rStream = iStream.sassComponent2dest(
        gulp.src(path.join(vars.srcRoot,'components/@(p-)*/*.scss'), {
            base: path.join(vars.srcRoot)
        }
    ));

    rStream = rStream.pipe(gulp.dest( util.joinFormat(vars.cssDest)));

    return rStream;
});

gulp.task('sass-base-to-dest', function(){
    var iConfig = fn.taskInit();
    if(!iConfig){
        return;
    }

    var vars = gulp.env.vars;

    var rStream;

    rStream = iStream.sassBase2dest(gulp.src([
        util.joinFormat(vars.srcRoot, 'sass/**/*.scss'),
        '!' + util.joinFormat(vars.srcRoot, 'sass/base/**/*.*')
    ]));

    rStream = rStream.pipe(gulp.dest( util.joinFormat(vars.cssDest)));

    return rStream;

});

gulp.task('css-to-dest', function(){
    var iConfig = fn.taskInit();
    if(!iConfig){
        return;
    }

    var vars = gulp.env.vars;

    var rStream;

    rStream = iStream.css2dest(gulp.src(path.join(vars.srcRoot, 'css', '**/*.css')));
    rStream = rStream.pipe(gulp.dest( util.joinFormat(vars.cssDest)));

    return rStream;

});
// - css task

// + images task
gulp.task('images',['images-base-task', 'images-component-task'], function() {
});

gulp.task('images-base-task', function() {
    var iConfig = fn.taskInit();
    if(!iConfig){
        return;
    }
    var vars = gulp.env.vars;
    var rStream;

    rStream = iStream.image2dest(gulp.src([ util.joinFormat( vars.srcRoot, 'images/**/*.*')], {base: util.joinFormat( vars.srcRoot, 'images')}));
    rStream = rStream.pipe(gulp.dest( util.joinFormat(vars.imagesDest)));

    return rStream;

});
gulp.task('images-component-task', function(){
    var iConfig = fn.taskInit();
    if(!iConfig){
        return;
    }

    var 
        vars = gulp.env.vars;

    var rStream;

    rStream = iStream.image2dest(gulp.src([util.joinFormat( vars.srcRoot, 'components/**/*.*')], {
        base: util.joinFormat( vars.srcRoot, 'components')
    }));

    rStream = rStream.pipe(gulp.dest( util.joinFormat( vars.imagesDest, 'components')));

    return rStream;

});
// - images task

// + js task
gulp.task('js',['requirejs-task', 'jslib-task', 'data-task'], function (done) {
    runSequence('concat', done);
});

gulp.task('requirejs-task', function() {
    var iConfig = fn.taskInit();
    if(!iConfig){
        return;
    }
    var vars = gulp.env.vars;

    var rStream;

    rStream = iStream.requirejs2dest(gulp.src([
        util.joinFormat(iConfig.alias.srcRoot, 'components/p-*/p-*.js'),
        util.joinFormat(iConfig.alias.srcRoot, 'js/**/*.js'),
        '!' + util.joinFormat(iConfig.alias.srcRoot, 'js/lib/**'),
        '!' + util.joinFormat(iConfig.alias.srcRoot, 'js/rConfig/**'),
        '!' + util.joinFormat(iConfig.alias.srcRoot, 'js/widget/**')
    ], {
        base: iConfig.alias.srcRoot
    }));

    rStream = rStream.pipe(gulp.dest(util.joinFormat(vars.jsDest)));

    return rStream;

});

gulp.task('jslib-task', function() {
    var iConfig = fn.taskInit();
    if(!iConfig){
        return;
    }
    var vars = gulp.env.vars;

    var rStream;

    rStream = iStream.js2dest(gulp.src(util.joinFormat( vars.srcRoot, 'js/lib/**/*.js')));
    rStream = rStream.pipe(gulp.dest(vars.jslibDest));

    return rStream;

});

gulp.task('data-task', function() {
    var iConfig = fn.taskInit();
    if(!iConfig){
        return;
    }
    var vars = gulp.env.vars;

    return gulp.src([util.joinFormat(vars.srcRoot, 'js/**/*.json')])
        .pipe(gulp.dest( vars.jsDest ));

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

    fn.supercall('concat', done);
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
gulp.task('rev-build', function(done){

    var 
        iConfig = fn.taskInit();

    if(!iConfig){
        return done();
    }

    fn.supercall('rev-build', done);
});

gulp.task('rev-update', function(done){
    var 
        iConfig = fn.taskInit();

    if(!iConfig){
        return done();
    }

    fn.supercall('rev-update', done);

});

// - rev




// + watch task
gulp.task('watch', ['all'], function() {
    var iConfig = fn.taskInit();
    if(!iConfig){
        return;
    }
    var vars = gulp.env.vars;
    var 
        watchit = function(glob, op, fn){
            if(arguments.length == 3){
                return watch(glob, op, util.debounce(fn, 500));

            } else {
                fn = op;
                return watch(glob, util.debounce(fn, 500));
            }
            
        };

    watchit(util.joinFormat(iConfig.alias.srcRoot, '**/**.*'), function(file){
        var 
            runtimeFiles = fn.srcRelative(file.history, {
                base: iConfig.alias.srcRoot,
                jslib: util.joinFormat(iConfig.alias.srcRoot, 'js/lib'),
                rConfig: util.joinFormat(iConfig.alias.srcRoot, 'js/rConfig/rConfig.js')
            }),
            streamCheck = function(){
                // TODO
            };

        console.log('runtimeFiles', runtimeFiles);

        var total = runtimeFiles.length;

        runtimeFiles.forEach(function(iPath){
            var 
                iExt = path.extname(iPath).replace(/^\./, ''),
                inside = function(rPath){
                    return fn.pathInside(util.joinFormat(iConfig.alias.srcRoot, rPath), iPath);
                },
                rStream;

            switch(iExt){
                case 'jade':
                    if(inside('components')){ // jade-to-dest-task
                        rStream = iStream.jade2dest(gulp.src([iPath], {
                            base: util.joinFormat(iConfig.alias.srcRoot)
                        }));
                        rStream = rStream.pipe(gulp.dest(vars.htmlDest));
                        
                    }

                    break;
                case 'html':
                    if(inside('html')){ // html-to-dest-task
                        rStream = iStream.html2dest(gulp.src([iPath], {
                            base: util.joinFormat(iConfig.alias.srcRoot, 'html')
                        }));
                        rStream = rStream.pipe(gulp.dest(vars.htmlDest));

                    }
                    break;

                case 'scss':
                    if(inside('components')){ // sass-component-to-dest
                        rStream = iStream.sassComponent2dest(gulp.src([iPath], {
                            base: path.join(vars.srcRoot)
                        }));
                        rStream = rStream.pipe(gulp.dest(util.joinFormat(vars.cssDest)));

                    } else if(inside('sass') && !inside('sass/base')){ // sass-base-to-dest
                        rStream = iStream.sassBase2dest(gulp.src([iPath], {
                            base: path.join(vars.srcRoot)
                        }));

                        rStream = rStream.pipe(gulp.dest( util.joinFormat(vars.cssDest)));

                    }
                    break;
                case 'css':
                    if(inside('css')){ // css-to-dest
                        rStream = iStream.css2dest(gulp.src([iPath], {
                            base: util.joinFormat(vars.srcRoot, 'css')
                        }));
                        rStream = rStream.pipe(gulp.dest( util.joinFormat(vars.cssDest)));
                    }
                    break;

                case 'js':
                    if(!inside('js/lib') && !inside('js/rConfig') && !inside('js/widget')){ // requirejs-task
                        rStream = iStream.requirejs2dest([iPath], {
                            base: iConfig.alias.srcRoot
                        });
                        rStream = rStream.pipe(gulp.dest(util.joinFormat(vars.jsDest)));

                        
                    } else if(inside('js/lib')){ // jslib-task
                        rStream = iStream.js2dest(gulp.src([iPath], {
                            base: util.joinFormat(iConfig.alias.srcRoot, 'js/lib')
                        }));
                        rStream = rStream.pipe(gulp.dest(vars.jslibDest));

                    }
                    break;

                case 'json':
                    if(inside('js')){ // data-task
                        rStream = gulp.src([iPath], {
                            base : util.joinFormat(iConfig.alias.srcRoot, 'js')
                        });

                        rStream = rStream.pipe(gulp.dest( vars.jsDest ));
                    }
                    break;

                default:
                    if(fn.isImage(iPath)){
                        if(inside('components')){ // images-component-task
                            rStream = iStream.image2dest(gulp.src([iPath], {
                                base: util.joinFormat( vars.srcRoot, 'components')
                            }));

                            rStream = rStream.pipe(gulp.dest( util.joinFormat( vars.imagesDest, 'components')));

                        } else if(inside('images')){ // images-base-task
                            rStream = iStream.image2dest(gulp.src([iPath], {
                                base: util.joinFormat( vars.srcRoot, 'images')
                            }));
                            rStream = rStream.pipe(gulp.dest( util.joinFormat(vars.imagesDest)));

                        }

                    } else { // 可能是 resource 里面的东西
                        // TODO

                    }
                    break;

            }

            if(rStream){
                rStream = iStream.destRelative(rStream);
                rStream.on('finish',streamCheck);
            } else {
                total--;
                streamCheck();
            }

        });

    });

    fn.supercall('watch-done');
});
// - watch task

// + all
gulp.task('all', function(done){
    var iConfig = fn.taskInit();
    if(!iConfig){
        return;
    }

    runSequence(['js', 'css', 'images', 'html', 'resource'], 'concat', 'rev-build',  function(){
        if(!gulp.env.silent){
            util.pop('all task done');
        }
        done();
    });
});


gulp.task('watchAll', ['watch']);
// - all
