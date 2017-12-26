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

var fn = {
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
    fn.supercall('livereload');

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


gulp.task('all', function(done){
    runSequence('webpack', 'rev-build', function(){
        if(!gulp.env.silent){
            util.pop('optimize task done');
        }
        
        done();
    });
});


// + rev
gulp.task('rev-build', function(done){
    fn.supercall('rev-build', done);
});

gulp.task('rev-update', function(done){
    fn.supercall('rev-update', done);

});

// - rev

gulp.task('watch', ['all'], function(){
    
    gulp.watch([ path.join(config.alias.srcRoot, '**/*.*')], function(){
        runSequence('webpack', 'rev-update', 'connect-reload', function(){
            if(!gulp.env.silent){
                util.pop('watch task done');

            }
            

        });
    });

    fn.supercall('watch-done');
});
