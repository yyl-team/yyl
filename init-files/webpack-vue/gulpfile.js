'use strict';
var 
    gulp = require('gulp'),
    gutil = require('gulp-util'),
    clean = require('gulp-clean'),
    // webpack = require('gulp-webpack'),
    webpack = require('webpack'),
    runSequence = require('run-sequence'),
    fs = require('fs'),
    path = require('path'),
    config = require('./config.js'),
    util = require('../../lib/yyl-util.js'),
    webpackConfig = require('./webpack.config.js');


require('colors');

if(fs.existsSync('./config.mine.js')){
    config = util.extend(config, require('./config.mine.js'));
}


var 
    fn = {
        configInit: function(){
            var 
                iSub = gulp.env.sub,
                iConfig = config.commit[iSub];

            return iConfig;
        }
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

gulp.task('connect-reload', function(){
    util.livereload();
});

gulp.task('webpack', function(done){
    var 
        iWebpackConfig = util.extend({}, webpackConfig);


    if(gulp.env.isCommit){

        iWebpackConfig.plugins.push(new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false
            }
        }));

        iWebpackConfig.devtool = false;
    }

    if(gulp.env.ver == 'remote' || gulp.env.isCommit){
        iWebpackConfig.output.publicPath = util.joinFormat(config.commit.hostname, iWebpackConfig.output.publicPath);
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

    var revPath = path.join(config.alias.revDest, 'rev-manifest.json'),
        pathTrans = function(src){
            if(/(\.css|\.css\.map)$/.test(src)){
                return util.joinFormat(path.relative( 
                    path.join(__dirname, config.alias.revRoot), 
                    path.join(__dirname, config.path.jsDest, '../css', src)
                ));

            } else {
                return util.joinFormat(path.relative( 
                    path.join(__dirname, config.alias.revRoot), 
                    path.join(__dirname, config.alias.jsDest, src)
                ));

            }
            

        };

        new util.Promise(function(next){
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
                    fPath = path.join(config.alias.revRoot, outRev[src]);
                    if(fs.existsSync(fPath)){
                        fs.writeFileSync(
                            path.join(config.alias.revRoot, src), 
                            fs.readFileSync(fPath)
                        );
                        console.log('[create] file:'.green, src);
                    }
                    
                }
            }
            next(outRev);


        }).then(function(revData, next){ // 拉去 remote 上的 和本地的 rev数据合并， 并生成一份文件
            var outRev = util.extend({}, revData);
            if(gulp.env.ver == 'remote' && gulp.env.sub){
                var 
                    iConfig = fn.configInit();

                console.log('start get the revFile', iConfig.commit.revAddr.green);

                util.get(iConfig.commit.revAddr + '?' + (+new Date()), function(data){
                    console.log('================'.green);
                    console.log(data.toString());
                    console.log('================'.green);
                    try{
                        var 
                            remoteRevData = JSON.parse(data.toString()),
                            fPath = '';

                        outRev = util.extend({}, revData, remoteRevData);
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
            fs.writeFileSync( path.join(config.alias.revDest, 'rev-manifest.json'), JSON.stringify(outRev, null, 4));
            console.log('[UPD] update the rev file'.green, util.joinFormat(config.alias.revDest, 'rev-manifest.json'));
            console.log(outRev);

            done();

        }).start();

});


gulp.task('all', function(done){
    runSequence('webpack', 'rev', done);
});

gulp.task('watch', ['all'], function(){
    
    gulp.watch(['./src/**/*.*'], function(){
        runSequence('all','connect-reload');
    });
});
