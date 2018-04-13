'use strict';
const fs = require('fs');
const path = require('path');
const querystring = require('querystring');
const gulp = require('gulp');
const through = require('through2');

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

const REG = {
  HTML_PATH_REG: /(src|href|data-main|data-original)(\s*=\s*)(['"])([^'"]*)(["'])/ig,
  HTML_SCRIPT_REG: /(<script[^>]*>)([\w\W]*?)(<\/script>)/ig,
  HTML_IGNORE_REG: /^(about:|data:|javascript:|#|\{\{)/,
  HTML_SCRIPT_TEMPLATE_REG: /type\s*=\s*['"]text\/html["']/,
  HTML_ALIAS_REG: /^(\{\$)(\w+)(\})/g,
  HTML_IS_ABSLUTE: /^\//,

  HTML_STYLE_REG: /(<style[^>]*>)([\w\W]*?)(<\/style>)/ig
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
    } catch (er) {
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
      log('msg', 'error', err.details);
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
      log('msg', 'error', err.details);
    });
    compilation.warnings.forEach((warn) => {
      log('msg', 'warn', warn.details);
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
// + var-replace task
gulp.task('var-replace', () => {
  return gulp.src([`${config.alias.htmlDest}/**/*.html`])
    .pipe(through.obj(function(file, enc, next) {
      let iCnt = file.contents.toString();
      iCnt = iCnt
        // 隔离 script 内容
        .replace(REG.HTML_SCRIPT_REG, (str, $1, $2, $3) => {
          if ($1.match(REG.HTML_SCRIPT_TEMPLATE_REG)) {
            return str;
          } else {
            return $1 + querystring.escape($2) + $3;
          }
        })
        // 隔离 style 标签
        .replace(REG.HTML_STYLE_REG, (str, $1, $2, $3) => {
          return $1 + querystring.escape($2) + $3;
        })
        .replace(REG.HTML_PATH_REG, (str, $1, $2, $3, $4, $5) => {
          var iPath = $4;
          var rPath = '';

          iPath = iPath.replace(REG.HTML_ALIAS_REG, (str, $1, $2) => {
            if (config.alias[$2]) {
              return util.path.join(
                iEnv.remotePath,
                path.relative(config.alias.destRoot, config.alias[$2])
              );
            } else {
              return str;
            }
          });

          if (
            iPath.match(REG.HTML_IGNORE_REG) ||
            iPath.match(REG.IS_HTTP) ||
            !iPath ||
            iPath.match(REG.HTML_IS_ABSLUTE)
          ) {
            return str;
          }

          return `${$1}${$2}${$3}${rPath}${$5}`;
        })
        // 取消隔离 script 内容
        .replace(REG.HTML_SCRIPT_REG, (str, $1, $2, $3) => {
          if ($1.match(REG.HTML_SCRIPT_TEMPLATE_REG)) {
            return str;
          } else {
            return $1 + querystring.unescape($2) + $3;
          }
        })
        // 取消隔离 style 标签
        .replace(REG.HTML_STYLE_REG, (str, $1, $2, $3) => {
          return $1 + querystring.unescape($2) + $3;
        });

      file.contents = Buffer.from(iCnt, 'utf-8');
      this.push(file);
      next();
    }))
    .pipe(gulp.dest(config.alias.htmlDest));
});
// - var-replace task

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
  runSequence(['concat', 'resource', 'var-replace'], 'rev-build', () => {
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
    runSequence('webpack', ['concat', 'resource', 'var-replace'], 'rev-update', () => {
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
