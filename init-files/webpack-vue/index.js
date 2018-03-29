'use strict';
const fs = require('fs');
const path = require('path');

const gulp = require('gulp');

const webpackConfig = require('./webpack.config.js');
const supercall = require('../../tasks/w-supercall.js');
const util = require('../../tasks/w-util.js');
const log = require('../../tasks/w-log.js');

// + self module
const webpack = require('webpack');
const runSequence = require('run-sequence').use(gulp);
const watch = require('gulp-watch');
// - self module

let config;
let iEnv;

const fn = {
  logDest: function(iPath) {
    log('msg', fs.existsSync(iPath) ? 'update' : 'create', iPath);
  }
};


// + webpack
gulp.task('webpack', (done) => {
  const localWconfigPath = path.join(util.vars.PROJECT_PATH, 'webpack.config.js');
  let iWconfig = util.extend(true, {}, webpackConfig);
  let localWconfig;


  if (fs.existsSync(localWconfigPath)) { // webpack 与 webpack local 整合
    log('msg', 'info', `get local webpack.config.js ${localWconfigPath}`);
    try {
      localWconfig = util.requireJs(localWconfigPath);
    } catch(er) {
      log('msg', 'error', er);
      log('finish');
      process.exit(1);
    }

    // 处理 loader 部分
    const fwConfig = util.extend(true, {}, iWconfig, localWconfig);
    const iLoaders = fwConfig.module.loaders = [].concat(iWconfig.module.loaders);
    const localLoaders = localWconfig.module.loaders;


    if (localLoaders && localLoaders.length) {
      localLoaders.forEach((obj) => {
        for (let i = 0, len = iLoaders.length; i < len; i++) {
          if (iLoaders[i].test.toString() === obj.test.toString()) {
            log('msg', 'info', [`change loader[${i}] ${iLoaders[i]} => `, obj]);
            iLoaders.splice(i, 1, obj);
            return;
          }
        }
        log('msg', 'info', ['add loaders', obj]);
        iLoaders.push(obj);
      });

      log('msg', 'info', ['mix loaders:', iLoaders]);
    }
    iWconfig = fwConfig;
  }


  if (iEnv.isCommit) {
    iWconfig.plugins.push(new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      }
    }));

    iWconfig.devtool = false;
  }

  if (iEnv.ver == 'remote' || iEnv.isCommit || iEnv.remote) {
    iWconfig.output.publicPath = util.joinFormat(
      config.commit.hostname,
      iWconfig.output.publicPath
    );
    log('msg', 'success', `change webpack publicPath => ${iWconfig.output.publicPath}`);
  }

  webpack(iWconfig, (err, stats) => {
    if (err) {
      log('msg', 'error', err);
    } else {
      log('msg', 'success', 'webpack run pass');
    }
    log('msg', 'info', stats.toString());

    const compilation = stats.compilation;
    const basePath = compilation.outputOptions.path;
    Object.keys(compilation.assets).forEach((key) => {
      fn.logDest(util.path.join(basePath, key));
    });
    compilation.errors.forEach((err) => {
      log('msg', 'error', err);
    });
    compilation.warnings.forEach((warn) => {
      log('msg', 'warn', warn);
    });
    done();
  });
});
// - webpack

// + concat task
gulp.task('concat', (done) => {
  if (!config.concat) {
    return done();
  }

  supercall.concat(iEnv).then(() => {
    done();
  });
});
// - concat task

// + resource
gulp.task('resource', (done) => {
  if (!config.resource) {
    return done();
  }
  supercall.resource(iEnv).then(() => {
    done();
  });
});
// - resource


// + rev
gulp.task('rev-build', (done) => {
  supercall.rev.build(iEnv).then(() => {
    done();
  });
});

gulp.task('rev-update', (done) => {
  supercall.rev.update(iEnv).then(() => {
    done();
  });
});
// - rev

// + all
gulp.task('all', ['webpack'], (done) => {
  runSequence(['concat', 'resource'], 'rev-build', () => {
    if (!iEnv.silent) {
      util.pop('all task done');
    }
    done();
  });
});
// - all

// + watch
gulp.task('watch', ['all'], () => {
  const watchit = function(glob, op, fn) {
    if (arguments.length == 3) {
      return watch(glob, op, util.debounce(fn, 500));
    } else {
      fn = op;
      return watch(glob, util.debounce(fn, 500));
    }
  };

  watchit(path.join(config.alias.srcRoot, '**/*.*'), () => {
    runSequence('webpack', ['concat', 'resource'], 'rev-update', () => {
      supercall.livereload();
      log('msg', 'success', 'watch task finished');
      log('finish');
      if (!iEnv.silent) {
        util.pop('watch task finished');
      }
    });
  });
  supercall.watchDone(iEnv);
});
// - watch

const opzer = {
  help: function() {
    return new Promise((next) => {
      util.help({
        usage: 'yyl',
        commands: {
          'all': 'optimize task',
          'watch': 'watch task',
          'commit': 'commit to remote'
        },
        options: {
          '--remote' : 'use remote revfile',
          '--sub': 'svn branches',
          '--nooptimize': 'commit the project to svn without optimize',
          '--config': 'use the val config path'
        }
      });
      next();
    });
  },
  all: function() {
    return new Promise((next) => {
      log('start', 'optimize');
      gulp.start('all', () => {
        log('finish');
        next();
      });
    });
  },
  watch: function() {
    return new Promise((next) => {
      log('start', 'watch');
      gulp.start('watch', () => {
        log('finish');
        next();
      });
    });
  }
};

module.exports = function(iconfig, cmd, op) {
  return new Promise((next) => {
    config = iconfig;
    iEnv = op;
    if (iEnv.ver == 'remote') {
      iEnv.remote = true;
    }
    if (iEnv.remote) {
      iEnv.ver = 'remote';
    }

    iEnv.remotePath = iEnv.remote || iEnv.isCommit ? config.commit.hostname : '/';

    if ( cmd in opzer ) {
      opzer[cmd](iEnv).then(() => {
        next();
      });
    } else {
      opzer.help().then(() => {
        next();
      });
    }
  });
};
