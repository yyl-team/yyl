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
    watch = require('gulp-watch'),
    webpackConfig = require('./webpack.config.js');


require('colors');

util.msg.init({
    type: {
        supercall: {name: 'Supercal', color: 'magenta'},
        optimize: {name: 'Optimize', color: 'green'},
        update: {name: 'Updated', color: 'cyan'}
    }
});

var fn = {
    supercall: function(cmd, done) {
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

        util.msg.supercall(iCmd);
        util.runNodeModule(iCmd, function() {
            return done && done();
        }, {
            cwd: __dirname
        });
    }
};


gulp.task('default', function() {
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

// + webpack
gulp.task('webpack', function(done) {
    var
        iWebpackConfig = util.extend(true, {}, webpackConfig),
        localWebpackConfigPath = path.join(config.alias.dirname, 'webpack.config.js'),
        localWebpackConfig;


    if (fs.existsSync(localWebpackConfigPath)) { // webpack 与 webpack local 整合
        util.msg.info('get local webpack.config.js:', localWebpackConfigPath);
        localWebpackConfig = require(localWebpackConfigPath);

        // 处理 loader 部分
        var fwConfig = util.extend(true, {}, iWebpackConfig, localWebpackConfig);
        var iLoaders = fwConfig.module.loaders = [].concat(iWebpackConfig.module.loaders);
        var localLoaders = localWebpackConfig.module.loaders;


        if (localLoaders && localLoaders.length) {
            localLoaders.forEach(function(obj) {
                for (var i = 0, len = iLoaders.length; i < len; i++) {
                    if (iLoaders[i].test.toString() === obj.test.toString()) {
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


    if (gulp.env.isCommit) {
        iWebpackConfig.plugins.push(new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false
            }
        }));

        iWebpackConfig.devtool = false;
    }

    if (gulp.env.ver == 'remote' || gulp.env.isCommit || gulp.env.remote) {
        iWebpackConfig.output.publicPath = util.joinFormat(
            config.commit.hostname,
            iWebpackConfig.output.publicPath
        );
        util.msg.info('change webpack publicPath =>', iWebpackConfig.output.publicPath);
    }

    webpack(iWebpackConfig, function(err, stats) {
        if (err) {
            throw new gutil.PluginError('webpack', err);
        } else {
            gutil.log('[webpack]', 'run pass');
        }
        gutil.log('[webpack]', stats.toString());

        done();
    });
});
// - webpack

// + rev
gulp.task('rev-build', function(done) {
    fn.supercall('rev-build', done);
});

gulp.task('rev-update', function(done) {
    fn.supercall('rev-update', done);
});
// - rev
// + concat
gulp.task('concat', function(done) {
    fn.supercall('concat', done);
});
// - concat

// + resource
gulp.task('resource', function(done) {
    fn.supercall('resource', done);
});
// - resource

gulp.task('all', function(done) {
    runSequence('webpack', ['concat', 'resource'], 'rev-build', function() {
        if (!gulp.env.silent) {
            util.pop('optimize task done');
        }
        done();
    });
});

gulp.task('watch', ['all'], function() {
    var
        watchit = function(glob, op, fn) {
            if (arguments.length == 3) {
                return watch(glob, op, util.debounce(fn, 500));
            } else {
                fn = op;
                return watch(glob, util.debounce(fn, 500));
            }
        };

    watchit(path.join(config.alias.srcRoot, '**/*.*'), function() {
        runSequence('webpack', ['concat', 'resource'], 'rev-update', 'reload', function() {
            if (!gulp.env.silent) {
                util.pop('watch task finished');
            }
        });
    });

    fn.supercall('watch-done');
});

gulp.task('reload', function() {
    fn.supercall('livereload');
});
