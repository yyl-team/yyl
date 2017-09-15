'use strict';
var 
    gulp = require('gulp'),
    gutil = require('gulp-util'),
    webpack = require('webpack'),
    runSequence = require('run-sequence'),
    fs = require('fs'),
    path = require('path'),
    config = require('./config.js'),
    util = require('yyl-util'),
    webpackConfig = require('./webpack.config.js');


require('colors');

if(fs.existsSync('./config.mine.js')){
    config = util.extend(config, require('./config.mine.js'));
}


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
        iWebpackConfig = util.extend(true, {}, webpackConfig),
        localWebpackConfigPath = path.join(config.alias.dirname, 'webpack.config.js'),
        localWebpackConfig;


    if(fs.existsSync(localWebpackConfigPath)){ // webpack 与 webpack local 整合
        util.msg.info('get local webpack.config.js:', localWebpackConfigPath);
        localWebpackConfig = require(localWebpackConfigPath);

        // 处理 loader 部分
        var fwConfig = util.extend(true, {}, iWebpackConfig, localWebpackConfig);
        var iLoaders = fwConfig.module.loaders = [].concat(iWebpackConfig.module.loaders);
        var localLoaders = localWebpackConfig.module.loaders;


        if(localLoaders && localLoaders.length){
            
            localLoaders.forEach(function(obj){
                for(var i = 0, len = iLoaders.length; i < len; i++){
                    if(iLoaders[i].test.toString() === obj.test.toString()){
                        util.msg.info('change loader['+ i +']', iLoaders[i], '=>', obj);
                        iLoaders.splice(i, 1, obj);
                        return;
                    }
                }
                util.msg.info('add loaders', obj);
                iLoaders.push(obj);
            });

            util.msg.line();
            util.msg.info('mix loaders:', iLoaders);
            util.msg.line();
        }
        iWebpackConfig = fwConfig;


    }


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
        util.msg.info('change webpack publicPath =>', iWebpackConfig.output.publicPath);
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
    if(!config.commit.revAddr){
        util.msg.warn('config.commit.revAddr is blank or  false, no run rev task');
        return done();

    }
    runSequence('rev-standard', 'rev-update', done);
});

gulp.task('rev-standard', function(done){
    if(!config.commit.revAddr){
        util.msg.warn('config.commit.revAddr is blank or  false, no run rev task');
        return done();

    }

    var 
        revPath = path.join(config.alias.revDest, 'rev-manifest.json'),
        pathTrans = function(src){
            if(/(\.css|\.css\.map)$/.test(src)){
                return util.joinFormat(path.relative( 
                    path.join(__dirname, config.alias.revRoot), 
                    path.join(__dirname, config.alias.jsDest, '../css', src)
                ));

            } else {
                return util.joinFormat(path.relative( 
                    path.join(__dirname, config.alias.revRoot), 
                    path.join(__dirname, config.alias.jsDest, src)
                ));

            }
        };

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

    util.msg.info(outRev);
    fs.writeFileSync( path.join(config.alias.revDest, 'rev-manifest.json'), JSON.stringify(outRev, null, 4));
    done();

});



gulp.task('rev-update', function(done){
    if(!config.commit.revAddr){
        util.msg.warn('config.commit.revAddr is blank or  false, no run rev task');
        return done();

    }

    var revPath = path.join(config.alias.revDest, 'rev-manifest.json');

        new util.Promise(function(next){
            var revData = {};

            if(fs.existsSync(revPath)){
                revData = JSON.parse(fs.readFileSync(revPath));

            }

            next(revData);
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
                        util.msg.create('file:', src);
                    }
                    
                }
            }
            next(outRev);


        }).then(function(revData, next){ // 拉去 remote 上的 和本地的 rev数据合并， 并生成一份文件
            var outRev = util.extend({}, revData);
            if(gulp.env.ver == 'remote' && gulp.env.sub){

                util.msg.info('start get the revFile', config.commit.revAddr.green);

                util.get(config.commit.revAddr + '?' + (+new Date()), function(data){
                    util.msg.success('get remote rev success');
                    util.msg.info('rev data =>', data.toString());
                    try{
                        var 
                            remoteRevData = JSON.parse(data.toString()),
                            fPath = '';

                        outRev = util.extend({}, revData, remoteRevData);
                        util.msg.success('rev get!');

                        for(var src in revData){
                            if(revData.hasOwnProperty(src)){
                                if(revData[src] != outRev[src]){
                                    fPath = path.join(config.alias.revRoot, revData[src]);
                                    if(fs.existsSync(fPath)){
                                        fs.writeFileSync(
                                            path.join(config.alias.revRoot, outRev[src]), 
                                            fs.readFileSync(fPath)
                                        );
                                        util.msg.create('file', revData[src]);
                                    }
                                }
                            }
                        }

                    } catch(er){
                        util.msg.error('rev get fail', er);
                    }
                    next(outRev);
                });

            } else {
                next(outRev);
            }
        }).then(function(outRev){ // 写入原有文件
            fs.writeFileSync( path.join(config.alias.revDest, 'rev-manifest.json'), JSON.stringify(outRev, null, 4));
            util.msg.info('update the rev file', util.joinFormat(config.alias.revDest, 'rev-manifest.json'));
            util.msg.info('=>', JSON.stringify(outRev, null, 4));

            done();

        }).start();

});


gulp.task('all', function(done){
    runSequence('webpack', 'rev', function(){
        if(!gulp.env.silent){
            util.pop('optimize task done');
        }
        
        done();
    });
});


gulp.task('html', function(){
    
});

gulp.task('watch', ['all'], function(){
    
    gulp.watch([ path.join(config.alias.srcRoot, '**/*.*')], function(){
        runSequence('webpack', 'html', 'rev', 'rev-update', 'connect-reload', function(){
            if(!gulp.env.silent){
                util.pop('watch task done');

            }
            

        });
    });

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
