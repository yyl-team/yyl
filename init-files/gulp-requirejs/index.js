'use strict';
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');

const gulp = require('gulp');
// const gutil = require('gulp-util');

const util = require('../../tasks/w-util.js');
const supercall = require('../../tasks/w-supercall.js');
const log = require('../../tasks/w-log.js');

// + self module
const sass = require('gulp-sass');
const minifycss = require('gulp-minify-css');
const jshint = require('gulp-jshint');
const uglify = require('gulp-uglify');
const imagemin = require('imagemin');
const imageminJpegtran = require('imagemin-jpegtran');
const imageminGifsicle = require('imagemin-gifsicle');
const imageminOptipng = require('imagemin-optipng');
const imageminSvgo = require('imagemin-svgo');

const rename = require('gulp-rename');
const replacePath = require('gulp-replace-path');

const requirejs = require('requirejs');

const inlinesource = require('yyl-inlinesource');
const filter = require('gulp-filter');
const gulpPug = require('gulp-pug');
const plumber = require('gulp-plumber');
const runSequence = require('run-sequence').use(gulp);
const prettify = require('gulp-prettify');
const through = require('through2');
const watch = require('gulp-watch');
// - self module

let config;
let iEnv;

const cache = {
  isError: false
};


var fn = {
  exit: function(err, stream) {
    log('msg', 'error', err);
    // log('finish');
    util.pop('optimize run error');
    cache.isError = true;
    stream.end();
    // process.exit(1);
  },
  // src => dest 路径替换
  src2destPathFormat: function(iPath, basePath, type) {
    let rPath = fn.hideUrlTail(iPath);
    if (rPath.match(util.REG.HTML_IGNORE_REG) || rPath.match(util.REG.IS_HTTP) || !rPath) {
      return iPath;
    }
    let absPath = '';
    if (rPath.match(util.REG.HTML_IS_ABSLUTE) || rPath.match(util.REG.IS_HTTP)) {
      absPath = rPath;
    } else {
      absPath = util.path.join(basePath, rPath);
      if (type === 'css-path' && !fs.existsSync(absPath)) {
        log('msg', 'warn', [
          `css url replace error, ${absPath}`,
          `  path not found: ${chalk.yellow(util.path.relative(util.vars.PROJECT_PATH, absPath))}`
        ].join('\n'));
        return iPath;
      }
    }
    const staticRemotePath = iEnv.staticRemotePath;
    const mainRemotePath = iEnv.mainRemotePath;

    // 替换指向 dest 目录的路径
    if (fn.matchFront(absPath, config.alias.destRoot)) {
      rPath = absPath
        .split(`${config.alias.destRoot}/`)
        .join(rPath.match(util.REG.IS_MAIN_REMOTE)? mainRemotePath : staticRemotePath);
      return rPath;
    }

    // 替换全局 图片
    if (fn.matchFront(absPath, config.alias.globalcomponents)) {
      rPath = absPath
        .split(config.alias.globalcomponents)
        .join(util.joinFormat(staticRemotePath, fn.relateDest(config.alias.imagesDest), 'globalcomponents'));
      return rPath;
    }

    // 替换 common 下 lib
    if (fn.matchFront(absPath, config.alias.globallib)) {
      rPath = absPath
        .split(config.alias.globallib)
        .join(util.joinFormat(staticRemotePath, fn.relateDest(config.alias.jslibDest), 'globallib'));
      return rPath;
    }

    // 替换 jslib
    const srcJslibPath = util.path.join(config.alias.srcRoot, 'js/lib');
    if (fn.matchFront(absPath, srcJslibPath)) {
      rPath = absPath
        .split(srcJslibPath)
        .join(util.joinFormat(staticRemotePath, fn.relateDest(config.alias.jslibDest)));
      return rPath;
    }

    // 替换 js
    const srcJsPath = util.path.join(config.alias.srcRoot, 'js');
    if (fn.matchFront(absPath, srcJsPath)) {
      rPath = absPath
        .split(srcJsPath)
        .join(util.joinFormat(staticRemotePath, fn.relateDest(config.alias.jsDest)));
      return rPath;
    }


    // 替换 css
    const srcCssPath = util.path.join(config.alias.srcRoot, 'css');
    if (fn.matchFront(absPath, srcCssPath)) {
      rPath = absPath
        .split(srcCssPath)
        .join(util.joinFormat(
          staticRemotePath,
          fn.relateDest(config.alias.cssDest)
        ));
      return rPath;
    }

    // 替换公用图片
    const srcImagesPath = util.path.join(config.alias.srcRoot, 'images');
    if (fn.matchFront(absPath, srcImagesPath)) {
      rPath = absPath
        .split(srcImagesPath)
        .join(util.joinFormat( staticRemotePath, fn.relateDest(config.alias.imagesDest)));
      return rPath;
    }

    // 替换公用tpl
    const srcTplPath = util.path.join(config.alias.srcRoot, 'tpl');
    if (fn.matchFront(absPath, srcTplPath)) {
      rPath = absPath
        .split(srcTplPath)
        .join(util.joinFormat( mainRemotePath, fn.relateDest(config.alias.tplDest)));
      return rPath;
    }


    const relativeHtmlPath = util.path.relative(
      util.path.join(config.alias.srcRoot, 'html'),
      absPath
    );

    // 替换 components 中的js
    if (relativeHtmlPath.match(util.REG.HTML_SRC_COMPONENT_JS_REG)) {
      rPath = relativeHtmlPath.replace(
        util.REG.HTML_SRC_COMPONENT_JS_REG,
        util.joinFormat(
          staticRemotePath,
          fn.relateDest(config.alias.jsDest),
          '/$1.js'
        )
      );
      return rPath;
    }

    // 替换 components 中的 images
    if (relativeHtmlPath.match(util.REG.HTML_SRC_COMPONENT_IMG_REG)) {
      rPath = relativeHtmlPath.replace(
        util.REG.HTML_SRC_COMPONENT_IMG_REG,
        util.joinFormat(
          staticRemotePath,
          fn.relateDest(config.alias.imagesDest),
          '$1'
        )
      );
      return rPath;
    }

    // 替换 resource 里面的资源
    const resource = config.resource;
    if (resource) {
      Object.keys(resource).forEach((key) => {
        if (fn.matchFront(absPath, key)) {
          rPath = absPath
            .split(key)
            .join(util.joinFormat(
              iPath.match(util.REG.IS_MAIN_REMOTE)? mainRemotePath : staticRemotePath,
              fn.relateDest(resource[key]))
            );
          return rPath;
        }
      });
    }
    return rPath;
  },
  logDest: function(iPath) {
    log('msg', fs.existsSync(iPath) ? 'update' : 'create', iPath);
  },
  matchFront: function(iPath, frontPath) {
    return iPath.substr(0, frontPath.length) === frontPath;
  },
  hideUrlTail: function(url) {
    return url
      .replace(/\?.*?$/g, '')
      .replace(/#.*?$/g, '');
  },
  blankPipe: function(fn) {
    return through.obj((file, enc, next) => {
      if (typeof fn == 'function') {
        fn(file);
      }
      next(null, file);
    });
  },
  relateDest: function(iPath) {
    return util.joinFormat(path.relative(config.alias.destRoot, iPath));
  },
  srcRelative:  function(files, op) {
    var iPaths;
    var iBase = op.base;
    if (util.type(files) != 'array') {
      iPaths = [files];
    } else {
      iPaths = files;
    }

    var isPage = function(iPath) {
      return fn.isPageComponent(iPath, op.base);
    };
    var isTpl = function(iPath) {
      return fn.isTplComponent(iPath, op.base);
    };
    var rMap = {
      source: {
        // 文件路径: [被引用的文件路径列表]
        // r-demo: [p-demo, r-demo2]
      },
      // 生成 w-demo: [p-a, p-b] 形式
      set: function(source, iPath) {
        if (!rMap.source[iPath]) {
          rMap.source[iPath] = [];
        }
        if (!~rMap.source[iPath].indexOf(source)) {
          rMap.source[iPath].push(source);
        }
      },
      // 数据整理, 将 w-demo: [p-a, p-b], p-a: [p-c, p-d],
      // 整理      为 w-demo: [p-a, p-c, p-d, p-b], p-a: [p-c, p-d]
      arrange: function() {
        const deepIt = (arr, times) => {
          if (times > 5) {
            return arr;
          }
          let r = [].concat(arr);
          let newArr = [];
          for (let i = 0; i < r.length;) {
            let iPath = r[i];
            if (rMap.source[iPath]) {
              rMap.source[iPath].forEach((fPath) => {
                if (!~r.indexOf(fPath) && !~newArr.indexOf(fPath)) {
                  newArr.push(fPath);
                }
              });
              r.splice(i, 1);
            } else {
              i++;
            }
          }
          if (newArr.length) {
            newArr = deepIt(newArr, times + 1);
            r = r.concat(newArr);
          }
          return r;
        };
        Object.keys(rMap.source).forEach((key) => {
          rMap.source[key] = deepIt(rMap.source[key], 0);
        });
      },
      findPages: function(iPath) {
        var cache = {};

        rMap.arrange();

        var findit = function(iPath) {
          var r = [];
          var rs = rMap.source[iPath];

          if (!rs || !rs.length) {
            return r;
          }

          rs = [].concat(rs);

          for (var i = 0; i < rs.length; ) {
            if (cache[rs[i]]) {
              rs.splice(i, 1);
            } else {
              cache[rs[i]] = true;
              i++;
            }
          }

          if (isPage(iPath) || isTpl(iPath)) {
            r.push(iPath);
            let pugPath = iPath.replace(new RegExp(`\\${path.extname(iPath)}$`), '.pug');
            if (fs.existsSync(pugPath)) {
              r.push(pugPath);
            }
          }

          rs.forEach((rPath) => {
            if (isPage(rPath) || isTpl(rPath)) {
              r.push(rPath);
              let pugPath = iPath.replace(new RegExp(`\\${path.extname(iPath)}$`), '.pug');
              if (fs.existsSync(pugPath)) {
                r.push(pugPath);
              }
            } else {
              r = r.concat(findit(rPath));
            }
            // 去重
            r = Array.from(new Set(r));
          });
          return r;
        };
        return findit(iPath);
      }
    };

    var
      friendship = {
        scss: function(iPath) {
          var sourceFiles = util.readFilesSync(iBase, /\.scss/);

          iPath = util.joinFormat(iPath);

          if (~sourceFiles.indexOf(iPath)) { //排除当前文件
            sourceFiles.splice(sourceFiles.indexOf(iPath), 1);
          }

          var r = [];

          if (isPage(iPath) || isTpl(iPath)) { // 如果自己是 p-xx 文件 也添加到 返回 array
            r.push(iPath);
            r.push(iPath.replace(/\.scss$/, '.pug'));
          }

          // 生成文件引用关系表
          sourceFiles.forEach((iSource) => {
            var iCnt = fs.readFileSync(iSource).toString();

            iCnt.replace(/@import ["']([^'"]+)['"]/g, (str, $1) => {
              var myPath = util.joinFormat(path.dirname(iSource), $1 + (path.extname($1)?'': '.scss'));
              rMap.set(iSource, myPath);
              return str;
            });
          });

          // 查找调用情况
          r = r.concat(rMap.findPages(iPath));

          return r;
        },
        pug: function(iPath) {
          var sourceFiles = util.readFilesSync(iBase, /\.pug$/);
          iPath = util.joinFormat(iPath);

          if (~sourceFiles.indexOf(iPath)) { // 排除当前文件
            sourceFiles.splice(sourceFiles.indexOf(iPath), 1);
          }

          var r = [];


          if (isPage(iPath) || isTpl(iPath)) { // 如果自己是 p-xx 文件 也添加到 返回 array
            r.push(iPath);
          }

          // 查找 文件当中 有引用当前 地址的, 此处应有递归
          sourceFiles.forEach((iSource) => {
            var iCnt = fs.readFileSync(iSource).toString();
            iCnt.replace(/(extends|include) ([^ \r\n\t]+)/g, (str, $1, $2) => {
              var myPath = util.joinFormat(path.dirname(iSource), `${$2}.pug`);
              rMap.set(iSource, myPath);
              return str;
            });
          });

          // 查找调用情况
          r = r.concat(rMap.findPages(iPath));

          return r;
        },
        js: function(iPath) {
          var sourceFiles = util.readFilesSync(iBase, /\.js/);
          iPath = util.joinFormat(iPath);

          if (~sourceFiles.indexOf(iPath)) { // 排除当前文件
            sourceFiles.splice(sourceFiles.indexOf(iPath), 1);
          }

          var r = [];

          if (isPage(iPath) || isTpl(iPath)) { // 如果自己是 p-xx 文件 也添加到 返回 array
            r.push(iPath);
            r.push(iPath.replace(/\.js/, '.pug'));
          }
          // 如果是 lib 里面的 js 也返回到当前 array
          if (op.jslib && op.jslib == iPath.substring(0, op.jslib.length)) {
            r.push(iPath);
          }

          var rConfig = {};
          if (op.rConfig && fs.existsSync(op.rConfig)) {
            try {
              rConfig = require(op.rConfig);
              rConfig = rConfig.paths;
            } catch (er) {}
          }

          var
            var2Path = function(name, dirname) {
              var rPath = rConfig[name];
              if (rPath) {
                return util.joinFormat(path.dirname(op.rConfig), rPath + (path.extname(rPath)? '': '.js'));
              } else {
                rPath = name;
                return util.joinFormat(dirname, rPath + (path.extname(rPath)? '': '.js'));
              }
            };

          // 查找 文件当中 有引用当前 地址的, 此处应有递归
          sourceFiles.forEach((iSource) => {
            var iCnt = fs.readFileSync(iSource).toString();
            iCnt.replace(/\r|\t/g, '')
              .replace(/require\s*\(\s*["']([^'"]+)['"]/g, (str, $1) => { // require('xxx') 模式
                var myPath = var2Path($1, path.dirname(iSource));
                rMap.set(iSource, myPath);

                return str;
              }).replace(/require\s*\(\s*(\[[^\]]+\])/g, (str, $1) => { // require(['xxx', 'xxx']) 模式
                var iMatchs = [];
                try {
                  iMatchs = new Function(`return ${  $1}`)();
                } catch (er) {}

                iMatchs.forEach((name) => {
                  var myPath = var2Path(name, path.dirname(iSource));
                  rMap.set(iSource, myPath);
                });

                return str;
              }).replace(/define\s*\(\s*(\[[^\]]+\])/g, (str, $1) => { // define(['xxx', 'xxx']) 模式
                var iMatchs = [];
                try {
                  iMatchs = new Function(`return ${  $1}`)();
                } catch (er) {}

                iMatchs.forEach((name) => {
                  var myPath = var2Path(name, path.dirname(iSource));
                  rMap.set(iSource, myPath);
                });
                return str;
              });
          });

          // 查找调用情况
          r = r.concat(rMap.findPages(iPath));
          return r;
        },
        other: function(iPath) { // 检查 html, css 当中 是否有引用
          return [iPath];
        }
      };
    var r = [];


    iPaths.forEach((iPath) => {
      var iExt = path.extname(iPath).replace(/^\./, '');
      var handle;
      switch (iExt) {
        case 'scss':
          handle = friendship.scss;
          break;

        case 'pug':
          handle = friendship.pug;
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
  // 从 dest 中生成的文件查找调用该文件的 css, html, 返回 这 css html 对应的 src 源文件
  destRelative: function(files, op) {
    var iFiles = util.type(iFiles) == 'array'? files: [files];
    var r = [];
    var destFiles = [];
    var revMap = {};
    // 根据地址 返回 输出目录内带有 remote 和 hash 的完整地址
    var getRevMapDest = function(iPath) {
      var revSrc = util.joinFormat(path.relative(op.revRoot, iPath));
      var iHost = '';
      if (iPath.match(util.REG.IS_MAIN_REMOTE)) {
        iHost = iEnv.mainRemotePath;
      } else {
        iHost = iEnv.staticRemotePath;
      }
      var hostRoot = util.joinFormat(
        iHost,
        path.relative(op.destRoot, op.revRoot)
      );
      return util.joinFormat(hostRoot, revMap[revSrc] || revSrc);
    };
    // 根据地址返回 rev map 中的 源文件
    var getRevSrcPath = function(iPath) {
      var revDest = util.joinFormat(path.relative(op.revRoot, iPath));

      for (var key in revMap) {
        if (revMap.hasOwnProperty(key)) {
          if (revMap[key] == revDest) {
            return util.joinFormat(op.revRoot, key);
          }
        }
      }

      return iPath;
    };


    if (op.revPath && fs.existsSync(op.revPath)) {
      try {
        revMap = JSON.parse(fs.readFileSync(op.revPath).toString());
      } catch (er) {}
    }


    iFiles.forEach((iPath) => {
      var iExt = path.extname(iPath).replace(/^\./, '');
      var searchFiles = [];

      switch (iExt) {
        case 'html': // html 没有谁会调用 html 的
          break;
        case 'tpl':
          searchFiles = util.readFilesSync(op.root, /\.(html)$/);
          break;

        case 'js':
        case 'css': // 查找调用这文件的 html
          searchFiles = util.readFilesSync(op.root, /\.(html|tpl)$/);
          break;
        default:
          if (fn.isImage(iPath)) { // 查找调用这文件的 html, css
            searchFiles = util.readFilesSync(op.root, /\.(html|tpl|css)$/);
          }
          break;
      }

      searchFiles.forEach((iSearch) => {
        var iCnt = fs.readFileSync(iSearch).toString();
        var iSrc;
        if (iCnt.split(getRevMapDest(iPath)).length > 1) { // match
          iSrc = getRevSrcPath(iSearch);

          if (!~destFiles.indexOf(iSrc)) {
            destFiles.push(iSrc);
          }
        }
      });
    });

    // 根据生成的 html, css 反推出对应src 的哪个文件
    destFiles.forEach((iPath) => {
      var filename = path.basename(iPath).replace(/\.[^.]+$/, '');
      var rPaths = [];
      if (op.htmlDest == iPath.substr(0, op.htmlDest.length) && path.extname(iPath) == '.html') { // html
        rPaths.push(util.joinFormat(op.srcRoot, 'html', path.basename(iPath)));
        rPaths.push(util.joinFormat(op.srcRoot, 'components', `p-${filename}`, `p-${filename}.pug`));
      } else if (op.cssDest == iPath.substr(0, op.cssDest.length) && path.extname(iPath) == '.css') { // css
        rPaths.push(util.joinFormat(op.srcRoot, 'css', path.basename(iPath)));
        rPaths.push(util.joinFormat(op.srcRoot, 'sass', `${filename}scss`));
        rPaths.push(util.joinFormat(op.srcRoot, 'components', `p-${filename}`, `p-${filename}.scss`));
      } else if (op.tplDest == iPath.substr(0, op.tplDest.length) && path.extname(iPath) == '.tpl') {
        rPaths.push(util.joinFormat(op.srcRoot, 'tpl', path.basename(iPath)));
        rPaths.push(util.joinFormat(op.srcRoot, 'components', `t-${filename}`, `t-${filename}.pug`));
      }

      rPaths.forEach((rPath) => {
        if (fs.existsSync(rPath)) {
          r.push(rPath);
        }
      });
    });

    return r;
  },
  pathInside: function(relPath, targetPath) {
    return !/^\.\.\//.test(util.joinFormat(path.relative(relPath, targetPath)));
  },
  isImage: function(iPath) {
    return /^\.(jpg|jpeg|bmp|gif|webp|png|apng|svga)$/.test(path.extname(iPath));
  },
  isTplComponent: function(iPath, iBase) {
    var pagePath = util.joinFormat(iBase, 'components/t-');
    var sameName = false;

    iPath.replace(/t-([a-zA-Z0-9-]+)\/t-([a-zA-Z0-9-]+)\.\w+$/, (str, $1, $2) => {
      sameName = $1 === $2;
      return str;
    });
    return sameName && pagePath == iPath.substr(0, pagePath.length);
  },
  isPageComponent: function(iPath, iBase) {
    var pagePath = util.joinFormat(iBase, 'components/p-');
    var sameName = false;

    iPath.replace(/p-([a-zA-Z0-9-]+)\/p-([a-zA-Z0-9-]+)\.\w+$/, (str, $1, $2) => {
      sameName = $1 === $2;
      return str;
    });
    return sameName && pagePath == iPath.substr(0, pagePath.length);
  }
};

var
  iStream = {
    // + html task
    pug2html: function(stream, op) {
      op = util.extend({
        extname: '.html',
        path: util.joinFormat( config.alias.srcRoot, 'html')
      }, op);
      var rStream = stream
        .pipe(plumber())
        .pipe(through.obj(function(file, enc, next) {
          log('msg', 'optimize', util.path.join(file.base, file.relative));
          this.push(file);
          next();
        }))
        .pipe(gulpPug({
          pretty: false,
          client: false
        }).on('error', (er) => {
          fn.exit(er.message, stream);
        }))
        .pipe(through.obj(function(file, enc, next) {
          const dirname = op.path;

          let iCnt = file.contents.toString();
          iCnt = util.htmlPathMatch(iCnt, (iPath, type) => {
            const r = (rPath) => {
              switch (type) {
                case '__url':
                  return `__url('${rPath}')`;

                default:
                  return rPath;
              }
            };
            let rPath = iPath;

            rPath = rPath.replace(util.REG.HTML_ALIAS_REG, (str, $1, $2) => {
              if (config.alias[$2]) {
                return util.path.relative(
                  path.dirname(file.path),
                  config.alias[$2]
                );
              } else {
                return str;
              }
            });

            if (
              rPath.match(util.REG.HTML_IGNORE_REG) ||
              rPath.match(util.REG.IS_HTTP) ||
              !rPath ||
              rPath.match(util.REG.HTML_IS_ABSLUTE)
            ) {
              return r(iPath);
            }

            const filename = path.basename(rPath, path.extname(iPath));

            if (path.extname(iPath) == '.scss' && /^[pt]-/.test(filename)) { // 纠正 p-xx.scss 路径
              rPath = util.joinFormat(path.relative(
                path.dirname(file.path),
                path.join(config.alias.srcRoot, 'css', `${filename.replace(/^[pt]-/, '')  }.css`))
              );
            }

            if (path.extname(iPath) == '.pug' && /^t-/.test(filename)) {
              rPath = util.joinFormat(path.relative(
                path.dirname(file.path),
                path.join(config.alias.srcRoot, 'tpl', `${filename.replace(/^[pt]-/, '')  }.tpl`))
              );
            }

            if (type === 'css-path') {
              if (
                !fs.existsSync(
                  fn.hideUrlTail(
                    util.path.join(
                      path.dirname(file.path),
                      rPath
                    )
                  )
                )
              ) {
                return r(rPath);
              } else {
                rPath = util.path.join(
                  path.relative(dirname, path.dirname(file.path)),
                  rPath
                ).replace(/\\+/g, '/').replace(/\/+/, '/');
              }
            } else {
              rPath = util.path.join(
                path.relative(dirname, path.dirname(file.path)),
                rPath
              ).replace(/\\+/g, '/').replace(/\/+/, '/');
            }

            return r(rPath);
          });

          file.contents = Buffer.from(iCnt, 'utf-8');
          this.push(file);
          next();
        }))
        .pipe(rename((path) => {
          path.basename = path.basename.replace(/^[pt]-/g, '');
          path.dirname = '';
          path.extname = op.extname;
        }))
        .pipe(prettify({indent_size: 4}));
        // .pipe(gulp.dest(util.joinFormat(config.alias.srcRoot, 'html')));

      return rStream;
    },
    html2dest: function(stream, op) {
      op = util.extend({
        path: path.join(config.alias.srcRoot, 'html')
      }, op);

      var relateHtml = function(iPath) {
        return util.joinFormat(
          path.relative(
            op.path,
            iPath
          )
        );
      };

      var staticRemotePath = iEnv.staticRemotePath;
      // var mainRemotePath = iEnv.mainRemotePath;


      // html task
      var rStream = stream
        .pipe(plumber())
        // 删除requirejs的配置文件引用
        .pipe(replacePath(/<script [^<]*local-usage><\/script>/g, ''))

        // 将用到的 commons 目录下的 images 资源引入到项目里面
        .pipe(through.obj(function(file, enc, next) {
          const iCnt = file.contents.toString();
          const gComponentPath = relateHtml(config.alias.globalcomponents);
          const copyPath = {};

          util.htmlPathMatch(iCnt, (iPath, type) => {
            const r = (rPath) => {
              switch (type) {
                case '__url':
                  return `__url('${rPath}')`;

                default:
                  return iPath;
              }
            };
            if (iPath.match(util.REG.HTML_IGNORE_REG) || iPath.match(util.REG.IS_HTTP)) {
              return r(iPath);
            }

            if (iPath.substr(0, gComponentPath.length) != gComponentPath) {
              return r(iPath);
            }


            const dirname = iPath.substr(gComponentPath.length);
            copyPath[util.joinFormat(op.path, iPath)] = util.joinFormat(config.alias.imagesDest, 'globalcomponents', dirname);

            return r(iPath);
          });

          this.push(file);

          // 复制
          if (Object.keys(copyPath).length) {
            log('msg', 'info', `copy file start: ${copyPath}`);
            util.copyFiles(copyPath, (err, files) => {
              if (err) {
                log('msg', 'error', ['copy file error', err]);
              }
              files.forEach((file) => {
                log('msg', 'create', file);
              });

              log('msg', 'info', 'copy file finished');
              next();
            }, null, null, config.alias.dirname, true);
          } else {
            next();
          }
        }))
        .pipe(through.obj(function(file, enc, next) {
          let iCnt = file.contents.toString();

          iCnt = util.htmlPathMatch(iCnt, (iPath, type) => {
            const r = (rPath) => {
              switch (type) {
                case '__url':
                  return `__url('${rPath}')`;
                default:
                  return rPath;
              }
            };

            const dirname = util.path.join(config.alias.srcRoot, 'html');

            return r(fn.src2destPathFormat(iPath, dirname, type));
          });

          file.contents = Buffer.from(iCnt, 'utf-8');
          this.push(file);
          next();
        }))
        // 把用到的 commons 目录下的 js 引入到 项目的 lib 底下
        .pipe(through.obj(function(file, enc, next) {
          file.contents.toString()
            .replace(new RegExp(`['"]${ util.joinFormat(staticRemotePath, fn.relateDest(config.alias.jslibDest), 'globallib') }([^'"]*)["']`, 'g'), (str, $1) => {
              var sourcePath = util.joinFormat(config.alias.globallib, $1);
              var toPath = util.joinFormat(config.alias.jslibDest, 'globallib', $1);
              util.copyFiles(
                sourcePath,
                toPath,
                (err) => {
                  if (!err) {
                    log('msg', 'create', toPath);
                  }
                }
              );
              return str;
            });

          this.push(file);
          next();
        }));
      // .pipe(gulp.dest(config.alias.htmlDest));

      return rStream;
    },
    pug2dest: function(stream) {
      var
        rStream = iStream.pug2html(stream);

      rStream = iStream.html2dest(rStream);
      return rStream;
    },
    // - html task
    // + tpl task
    pug2tpl: function(stream) {
      var rStream = iStream.pug2html(stream, {
        path: path.join(config.alias.srcRoot, 'tpl'),
        extname: '.tpl'
      });
      return rStream;
    },
    tpl2dest: function(stream) {
      var rStream = iStream.html2dest(stream, {
        path: path.join(config.alias.srcRoot, 'tpl')
      });
      return rStream;
    },
    pug2tpldest: function(stream) {
      var rStream = iStream.pug2tpl(stream);
      rStream = iStream.tpl2dest(rStream);
      return rStream;
    },
    // - tpl task
    // + css task
    sassBase2css: function(stream) {
      var
        rStream = stream
          .pipe(plumber())
          .pipe(sass({outputStyle: 'nested'}).on('error', (err) => {
            fn.exit(err.message, stream);
          }));
      return rStream;
    },
    sassComponent2css: function(stream) {
      var
        rStream = stream
          .pipe(plumber())
          .pipe(through.obj(function(file, enc, next) {
            log('msg', 'optimize', util.path.join(file.base, file.relative));
            this.push(file);
            next();
          }))
          .pipe(sass({outputStyle: 'nested'}).on('error', (err) => {
            fn.exit(err.message, stream);
          }))
          .pipe(through.obj(function(file, enc, next) {
            let iCnt = file.contents.toString();
            let rPath = '';
            const dirname = util.joinFormat(config.alias.srcRoot, 'css');

            iCnt = util.cssPathMatch(iCnt, (iPath) => {
              if (iPath.match(util.REG.CSS_IGNORE_REG)) {
                return iPath;
              }
              if (iPath.match(util.REG.IS_HTTP) || iPath.match(util.REG.CSS_IS_ABSLURE)) {
                return iPath;
              }
              const fDirname = path.dirname(path.relative(dirname, file.path));
              rPath = util.path.join(fDirname, iPath);

              const rPath2 = util.path.join(dirname, iPath);

              if (fs.existsSync(fn.hideUrlTail(util.path.join(dirname, rPath)))) { // 以当前文件所在目录为 根目录查找文件
                return rPath;
              } else if (fs.existsSync(fn.hideUrlTail(rPath2))) { // 如果直接是根据生成的 css 目录去匹配 也允许
                return iPath;
              } else {
                log('msg', 'warn', [
                  `css url replace error, ${path.basename(file.history.toString())}`,
                  `  path not found: ${chalk.yellow(util.path.relative(util.vars.PROJECT_PATH, fn.hideUrlTail(util.joinFormat(dirname, rPath))))}`
                ].join('\n'));
                return iPath;
              }
            });

            file.contents = Buffer.from(iCnt, 'utf-8');
            this.push(file);
            next();
          }))
          .pipe(rename((path) => {
            path.dirname = '';
            path.basename = path.basename.replace(/^[pt]-/, '');
          }));
      // .pipe(gulp.dest(util.joinFormat(config.alias.srcRoot, 'css')));
      return rStream;
    },
    css2dest: function(stream) {
      var relateCss = function(iPath) {
        return util.joinFormat(
          path.relative(
            path.join(config.alias.srcRoot, 'css'),
            iPath
          )
        );
      };

      var
        rStream = stream
          .pipe(plumber())
          // 将commons components 目录下的 图片 引入到 globalcomponents 里面
          .pipe(through.obj(function(file, enc, next) {
            var iCnt = file.contents.toString();
            var gComponentPath = relateCss(config.alias.globalcomponents);
            var copyPath = {};

            var filterHandle = function(str, $1, $2) {
              var iPath = $2;

              if (iPath.match(/^(about:|data:)/)) {
                return str;
              }



              if (iPath.substr(0, gComponentPath.length) != gComponentPath) {
                return str;
              }

              iPath = iPath.replace(/\?.*?$/g, '');

              var dirname = iPath.substr(gComponentPath.length);
              copyPath[util.joinFormat(config.alias.srcRoot, 'css', iPath)] = util.joinFormat(config.alias.imagesDest, 'globalcomponents', dirname);

              return str;
            };


            iCnt
              .replace(util.REG.CSS_PATH_REG, filterHandle)
              .replace(util.REG.CSS_PATH_REG2, filterHandle);

            this.push(file);

            // 复制
            if (Object.keys(copyPath).length) {
              util.copyFiles(copyPath, (err, files) => {
                if (err) {
                  log('msg', 'error', ['copy file error', err]);
                  return next();
                }
                files.forEach((file) => {
                  log('msg', 'create', file);
                });

                log('msg', 'info', 'copy file finished');
                next();
              }, null, null, config.alias.dirname, true);
            } else {
              next();
            }
          }))
          .pipe(through.obj(function(file, enc, next) {
            var iCnt = file.contents.toString();

            iCnt = util.cssPathMatch(iCnt, (iPath, type) => {
              const dirname = util.path.join(config.alias.srcRoot, 'css');
              return fn.src2destPathFormat(iPath, dirname, type);
            });

            file.contents = Buffer.from(iCnt, 'utf-8');
            this.push(file);
            next();
          }))
          .pipe(iEnv.isCommit?minifycss({
            compatibility: 'ie7'
          }): fn.blankPipe());
      return rStream;
    },
    sassComponent2dest: function(stream) {
      var rStream;
      rStream = iStream.sassComponent2css(stream);
      rStream = iStream.css2dest(rStream);

      return rStream;
    },
    sassBase2dest: function(stream) {
      var rStream;
      rStream = iStream.sassBase2css(stream);
      rStream = iStream.css2dest(rStream);

      return rStream;
    },
    // - css task
    // + image task
    image2dest: function(stream) {
      var
        rStream = stream
          .pipe(plumber())
          .pipe(filter(['**/*.jpg', '**/*.jpeg', '**/*.png', '**/*.bmp', '**/*.gif', '**/*.webp']))
          .pipe(through.obj(function(file, enc, next) {
            log('msg', 'optimize', util.path.join(file.base, file.relative));
            if (iEnv.isCommit) {
              imagemin.buffer(file.contents, {
                use: [
                  imageminJpegtran({progressive: true}),
                  imageminGifsicle({optimizationLevel: 3, interlaced: true}),
                  imageminOptipng({optimizationLevel: 0}),
                  imageminSvgo()
                ]
              }).then((data) => {
                file.contents = data;
                this.push(file);
                next();
              });
            } else {
              this.push(file);
              next();
            }
          }));

      return rStream;
    },
    // - image task
    // + js task
    requirejs2dest: function(stream) {
      var
        rStream = stream
          .pipe(filter('**/*.js'))
          .pipe(plumber())
          .pipe(jshint.reporter('default'))
          .pipe(jshint())
          .pipe(through.obj(function(file, enc, cb) {
            var self = this;

            var iCnt = file.contents.toString();
            if (iCnt.split(util.REG.JS_DISABLE_AMD).length > 1) {
              log('msg', 'optimize', util.path.join(file.base, file.relative));
              self.push(file);
              cb();
            } else {
              // exclude 处理
              const paths = {};
              if (iCnt.match(util.REG.JS_EXCLUDE)) {
                iCnt.replace(util.REG.JS_EXCLUDE, (str, $1) => {
                  const ex = $1.split(/\s*,\s*/);
                  ex.some((iEx) => {
                    let key = iEx.trim();

                    if (key) {
                      paths[key] = 'empty:';
                    }
                  });
                });
              }

              var optimizeOptions = {
                mainConfigFile: util.joinFormat(config.alias.srcRoot, 'js/rConfig/rConfig.js'),
                logLevel: 2,
                baseUrl: path.dirname(util.joinFormat(config.alias.srcRoot, file.relative)),
                generateSourceMaps: false,
                optimize: 'none',
                include: util.joinFormat(config.alias.srcRoot, file.relative),
                paths: paths,
                out: function(text) {
                  const r = text.replace(
                    util.path.join(file.base, file.relative),
                    util.path.relative(config.alias.srcRoot, path.join(file.base, file.relative))
                  );
                  file.contents = Buffer.from(r, 'utf-8');
                  self.push(file);
                  cb();
                }
              };

              log('msg', 'optimize', util.path.join(file.base, file.relative));
              requirejs.optimize(optimizeOptions, null, (err) => {
                if (err) {
                  fn.exit(err.originalError.message, stream);
                }
                cb();
              });
            }
          }))
          // 路径匹配
          .pipe(through.obj(function(file, enc, next) {
            let iCnt = file.contents.toString();
            iCnt = util.jsPathMatch(iCnt, (iPath, type) => {
              const r = (rPath) => {
                switch (type) {
                  case '__url':
                    return `__url('${rPath}')`;

                  default:
                    return `'${rPath}'`;
                }
              };
              const dirname = util.path.join(path.dirname(path.join(file.base, file.relative)));
              return r(fn.src2destPathFormat(iPath, dirname, type));
            });
            file.contents = Buffer.from(iCnt, 'utf-8');
            this.push(file);
            next();
          }))
          .pipe(iEnv.isCommit ? uglify() : fn.blankPipe())
          .pipe(rename((path) => {
            path.basename = path.basename.replace(/^[pjt]-/g, '');
            path.dirname = '';
          }));
      return rStream;
    },
    js2dest: function(stream) {
      var
        rStream = stream
          // 路径匹配
          .pipe(through.obj(function(file, enc, next) {
            let iCnt = file.contents.toString();
            iCnt = util.jsPathMatch(iCnt, (iPath, type) => {
              const r = (rPath) => {
                switch (type) {
                  case '__url':
                    return `__url('${rPath}')`;

                  default:
                    return `'${rPath}'`;
                }
              };
              const dirname = util.path.join(path.dirname(file.base, file.relative));
              return r(fn.src2destPathFormat(iPath, dirname, type));
            });
            file.contents = Buffer.from(iCnt, 'utf-8');
            this.push(file);
            next();
          }))
          .pipe(plumber())
          .pipe(iEnv.isCommit ? uglify() : fn.blankPipe());

      return rStream;
    },
    // - js task
    // + inline task
    inline2dest: (stream) => {
      const rStream = stream
        .pipe(plumber())
        .pipe(through.obj(function(file, enc, next) {
          const self = this;
          const fileDir = path.dirname(path.join(file.base, file.relative));
          inlinesource({
            content: file.contents,
            baseUrl: fileDir,
            publishPath: util.path.join(
              iEnv.staticRemotePath,
              path.relative(config.alias.destRoot, fileDir)
            ),
            minify: false,
            type: 'html'
          }).then((iCnt) => {
            if (file.toString() != iCnt) {
              fn.logDest(path.join(file.base, file.relative));
            }
            file.contents = Buffer.from(iCnt, 'utf-8');
            self.push(file);
            next();
          }).catch((er) => {
            log('msg', 'warn', er.message);
          });
        }));
      return rStream;
    },
    // - inline task
    // + dest task
    // 从 dest 生成的一个文件找到关联的其他 src 文件， 然后再重新生成到 dest
    dest2dest: function(stream, op) {
      var rStream;
      rStream = stream.pipe(through.obj((file, enc, next) => {
        var relativeFiles = fn.destRelative(util.joinFormat(file.base, file.relative), op);
        var total = relativeFiles.length;
        var streamCheck = function() {
          if (total === 0) {
            next(null, file);
          }
        };

        relativeFiles.forEach((iPath) => {
          var rStream = iStream.any2dest(iPath, {
            base: op.base
          });

          rStream.on('finish', () => {
            total--;
            streamCheck();
          });
        });
        streamCheck();
      }));
      return rStream;
    },
    // 任意src 内文件输出到 dest (遵循 构建逻辑)
    any2dest: function(iPath, op) {
      var iExt = path.extname(iPath).replace(/^\./, '');
      var inside = function(rPath) {
        return fn.pathInside(util.joinFormat(config.alias.srcRoot, rPath), iPath);
      };
      var rStream;

      switch (iExt) {
        case 'pug':
        case 'jade':
          if (inside('components')) { // pug-to-dest-task
            if (fn.isPageComponent(iPath, op.base)) {
              rStream = iStream.pug2dest(gulp.src([iPath], {
                base: util.joinFormat(config.alias.srcRoot, 'components')
              }));
              rStream = rStream
                .pipe(fn.blankPipe((file) => {
                  fn.logDest(util.path.join(config.alias.htmlDest, file.relative));
                }))
                .pipe(gulp.dest(config.alias.htmlDest));
            } else if (fn.isTplComponent(iPath, op.base)) {
              rStream = iStream.pug2tpldest(gulp.src([iPath], {
                base: util.joinFormat(config.alias.srcRoot, 'components')
              }));
              rStream = rStream
                .pipe(fn.blankPipe((file) => {
                  fn.logDest(util.path.join(config.alias.tplDest, file.relative));
                }))
                .pipe(gulp.dest(config.alias.tplDest));
            }
          }
          break;

        case 'html':
          if (inside('html')) { // html-to-dest-task
            rStream = iStream.html2dest(gulp.src([iPath], {
              base: util.joinFormat(config.alias.srcRoot, 'html')
            }));
            rStream = rStream
              .pipe(fn.blankPipe((file) => {
                fn.logDest(util.path.join(config.alias.htmlDest, file.relative));
              }))
              .pipe(gulp.dest(config.alias.htmlDest));
          }
          break;

        case 'tpl':
          if (inside('tpl')) { // html-to-dest-task
            rStream = iStream.tpl2dest(gulp.src([iPath], {
              base: util.joinFormat(config.alias.srcRoot, 'tpl')
            }));
            rStream = rStream
              .pipe(fn.blankPipe((file) => {
                fn.logDest(util.path.join(config.alias.tplDest, file.relative));
              }))
              .pipe(gulp.dest(config.alias.tplDest));
          }
          break;

        case 'scss':
          if (inside('components')) { // sass-component-to-dest
            rStream = iStream.sassComponent2dest(gulp.src([iPath], {
              base: path.join(config.alias.srcRoot)
            }));
            rStream = rStream.pipe(gulp.dest(util.joinFormat(config.alias.cssDest)));
          } else if (inside('sass') && !inside('sass/base')) { // sass-base-to-dest
            rStream = iStream.sassBase2dest(gulp.src([iPath], {
              base: path.join(config.alias.srcRoot)
            }));

            rStream = rStream
              .pipe(fn.blankPipe((file) => {
                fn.logDest(util.path.join(config.alias.cssDest, file.relative));
              }))
              .pipe(gulp.dest( util.joinFormat(config.alias.cssDest)));
          }
          break;
        case 'css':
          if (inside('css')) { // css-to-dest
            rStream = iStream.css2dest(gulp.src([iPath], {
              base: util.joinFormat(config.alias.srcRoot, 'css')
            }));
            rStream = rStream
              .pipe(fn.blankPipe((file) => {
                fn.logDest(util.path.join(config.alias.cssDest, file.relative));
              }))
              .pipe(gulp.dest( util.joinFormat(config.alias.cssDest)));
          }
          break;

        case 'js':
          if (!inside('js/lib') && !inside('js/rConfig') && !inside('js/widget')) { // requirejs-task
            rStream = iStream.requirejs2dest(gulp.src([iPath], {
              base: config.alias.srcRoot
            }));
            rStream = rStream
              .pipe(fn.blankPipe((file) => {
                fn.logDest(util.path.join(config.alias.jsDest, file.relative));
              }))
              .pipe(gulp.dest(util.joinFormat(config.alias.jsDest)));
          } else if (inside('js/lib')) { // jslib-task
            rStream = iStream.js2dest(gulp.src([iPath], {
              base: util.joinFormat(config.alias.srcRoot, 'js/lib')
            }));
            rStream = rStream
              .pipe(fn.blankPipe((file) => {
                fn.logDest(util.path.join(config.alias.jslibDest, file.relative));
              }))
              .pipe(gulp.dest(config.alias.jslibDest));
          }
          break;

        case 'json':
          if (inside('js')) { // data-task
            rStream = gulp.src([iPath], {
              base : util.joinFormat(config.alias.srcRoot, 'js')
            });

            rStream = rStream
              .pipe(fn.blankPipe((file) => {
                fn.logDest(util.path.join(config.alias.jsDest, file.relative));
              }))
              .pipe(gulp.dest(config.alias.jsDest));
          }
          break;

        default:
          if (fn.isImage(iPath)) {
            if (inside('components')) { // images-component-task
              rStream = iStream.image2dest(gulp.src([iPath], {
                base: util.joinFormat( config.alias.srcRoot, 'components')
              }));

              rStream = rStream
                .pipe(fn.blankPipe((file) => {
                  fn.logDest(util.path.join(config.alias.imagesDest, file.relative));
                }))
                .pipe(gulp.dest( util.joinFormat( config.alias.imagesDest, 'components')));
            } else if (inside('images')) { // images-base-task
              rStream = iStream.image2dest(gulp.src([iPath], {
                base: util.joinFormat( config.alias.srcRoot, 'images')
              }));
              rStream = rStream
                .pipe(fn.blankPipe((file) => {
                  fn.logDest(util.path.join(config.alias.imagesDest, file.relative));
                }))
                .pipe(gulp.dest( util.joinFormat(config.alias.imagesDest)));
            }
          }
          break;
      }

      return rStream;
    }
    // - dest task

  };

// + html task
gulp.task('html', ['pug-to-dest-task', 'html-to-dest-task'], () => {
});

gulp.task('pug-to-dest-task', () => {
  let rStream;
  if (cache.isError) {
    return;
  }

  rStream = iStream.pug2dest(gulp.src([
    util.joinFormat(config.alias.srcRoot, 'components/@(p-)*/*.pug'),
    util.joinFormat(config.alias.srcRoot, 'components/@(p-)*/*.jade')
  ]));
  rStream = rStream
    .pipe(fn.blankPipe((file) => {
      fn.logDest(util.path.join(config.alias.htmlDest, file.relative));
    }))
    .pipe(gulp.dest(config.alias.htmlDest));


  return rStream;
});

gulp.task('html-to-dest-task', () => {
  var rStream;
  if (cache.isError) {
    return;
  }

  rStream = iStream.html2dest(gulp.src(util.joinFormat(config.alias.srcRoot, 'html/*.html')));
  rStream = rStream
    .pipe(fn.blankPipe((file) => {
      fn.logDest(util.path.join(config.alias.htmlDest, file.relative));
    }))
    .pipe(gulp.dest(config.alias.htmlDest));

  return rStream;
});


// - html task
// + tpl task
gulp.task('tpl', ['pug-to-tpl-dest-task', 'tpl-to-dest-task'], () => {
});

gulp.task('pug-to-tpl-dest-task', () => {
  var rStream;
  if (cache.isError) {
    return;
  }

  rStream = iStream.pug2tpldest(gulp.src([
    util.joinFormat(config.alias.srcRoot, 'components/@(t-)*/*.pug'),
    util.joinFormat(config.alias.srcRoot, 'components/@(t-)*/*.jade')
  ]));
  rStream = rStream
    .pipe(fn.blankPipe((file) => {
      fn.logDest(util.path.join(config.alias.tplDest, file.relative));
    }))
    .pipe(gulp.dest(config.alias.tplDest));


  return rStream;
});

gulp.task('tpl-to-dest-task', () => {
  var rStream;
  if (cache.isError) {
    return;
  }

  rStream = iStream.html2dest(gulp.src(util.joinFormat(config.alias.srcRoot, 'tpl/*.tpl')));
  rStream = rStream
    .pipe(fn.blankPipe((file) => {
      fn.logDest(util.path.join(config.alias.tplDest, file.relative));
    }))
    .pipe(gulp.dest(config.alias.tplDest));

  return rStream;
});
// - tpl task
// + inline task
gulp.task('inline-source', ['html-inline', 'tpl-inline'], () => {});

gulp.task('html-inline', () => {
  if (!iEnv.isCommit) {
    return;
  }
  let rStream;
  rStream = iStream.inline2dest(gulp.src([
    util.joinFormat(config.alias.htmlDest, '**/*.html')
  ]));

  rStream = rStream
    .pipe(fn.blankPipe((file) => {
      fn.logDest(util.path.join(config.alias.htmlDest, file.relative));
    }))
    .pipe(gulp.dest(config.alias.htmlDest));


  return rStream;
});
gulp.task('tpl-inline', () => {
  if (!iEnv.isCommit) {
    return;
  }
  if (cache.isError) {
    return;
  }
  let rStream;
  rStream = iStream.inline2dest(gulp.src([
    util.joinFormat(config.alias.tplDest, '**/*.tpl')
  ]));

  rStream = rStream
    .pipe(fn.blankPipe((file) => {
      fn.logDest(util.path.join(config.alias.tplDest, file.relative));
    }))
    .pipe(gulp.dest(config.alias.tplDest));


  return rStream;
});
// + inline task
// + css task
gulp.task('css', ['sass-component-to-dest', 'sass-base-to-dest', 'css-to-dest'], (done) => {
  runSequence('concat-css', done);
});
gulp.task('sass-component-to-dest', () => {
  var rStream;
  if (cache.isError) {
    return;
  }

  rStream = iStream.sassComponent2dest(
    gulp.src([
      path.join(config.alias.srcRoot, 'components/@(p-)*/*.scss'),
      path.join(config.alias.srcRoot, 'components/@(t-)*/*.scss')
    ], {
      base: path.join(config.alias.srcRoot)
    })
  );

  rStream = rStream
    .pipe(fn.blankPipe((file) => {
      fn.logDest(util.path.join(config.alias.cssDest, file.relative));
    }))
    .pipe(gulp.dest( util.joinFormat(config.alias.cssDest)));

  return rStream;
});

gulp.task('sass-base-to-dest', () => {
  var rStream;
  if (cache.isError) {
    return;
  }

  rStream = iStream.sassBase2dest(gulp.src([
    util.joinFormat(config.alias.srcRoot, 'sass/**/*.scss'),
    `!${  util.joinFormat(config.alias.srcRoot, 'sass/base/**/*.*')}`
  ]));

  rStream = rStream
    .pipe(fn.blankPipe((file) => {
      fn.logDest(util.path.join(config.alias.cssDest, file.relative));
    }))
    .pipe(gulp.dest( util.joinFormat(config.alias.cssDest)));

  return rStream;
});

gulp.task('css-to-dest', () => {
  var rStream;
  if (cache.isError) {
    return;
  }

  rStream = iStream.css2dest(gulp.src(path.join(config.alias.srcRoot, 'css', '**/*.css')));
  rStream = rStream
    .pipe(fn.blankPipe((file) => {
      fn.logDest(util.path.join(config.alias.cssDest, file.relative));
    }))
    .pipe(gulp.dest( util.joinFormat(config.alias.cssDest)));

  return rStream;
});
// - css task

// + images task
gulp.task('images', ['images-base-task', 'images-component-task'], () => {
});

gulp.task('images-base-task', () => {
  var rStream;
  if (cache.isError) {
    return;
  }

  rStream = iStream.image2dest(gulp.src([ util.joinFormat( config.alias.srcRoot, 'images/**/*.*')], {base: util.joinFormat( config.alias.srcRoot, 'images')}));
  rStream = rStream
    .pipe(fn.blankPipe((file) => {
      fn.logDest(util.path.join(config.alias.imagesDest, file.relative));
    }))
    .pipe(gulp.dest( util.joinFormat(config.alias.imagesDest)));

  return rStream;
});
gulp.task('images-component-task', () => {
  var rStream;
  if (cache.isError) {
    return;
  }

  rStream = iStream.image2dest(gulp.src([util.joinFormat( config.alias.srcRoot, 'components/**/*.*')], {
    base: util.joinFormat( config.alias.srcRoot, 'components')
  }));

  rStream = rStream
    .pipe(fn.blankPipe((file) => {
      fn.logDest(util.path.join(config.alias.imagesDest, 'components', file.relative));
    }))
    .pipe(gulp.dest( util.joinFormat( config.alias.imagesDest, 'components')));

  return rStream;
});
// - images task

// + js task
gulp.task('js', ['requirejs-task', 'jslib-task', 'data-task'], (done) => {
  runSequence('concat-js', done);
});

gulp.task('requirejs-task', (done) => {
  var rStream;
  if (cache.isError) {
    return;
  }

  rStream = iStream.requirejs2dest(gulp.src([
    util.joinFormat(config.alias.srcRoot, 'components/p-*/p-*.js'),
    util.joinFormat(config.alias.srcRoot, 'components/t-*/t-*.js'),
    util.joinFormat(config.alias.srcRoot, 'js/**/*.js'),
    `!${util.joinFormat(config.alias.srcRoot, 'js/lib/**')}`,
    `!${util.joinFormat(config.alias.srcRoot, 'js/rConfig/**')}`,
    `!${util.joinFormat(config.alias.srcRoot, 'js/widget/**')}`
  ], {
    base: config.alias.srcRoot
  }));

  rStream = rStream
    .pipe(fn.blankPipe((file) => {
      fn.logDest(util.path.join(config.alias.jsDest, file.relative));
    }))
    .pipe(gulp.dest(util.joinFormat(config.alias.jsDest)));
  rStream.on('finish', () => {
    done();
  });
});

gulp.task('jslib-task', () => {
  var rStream;
  if (cache.isError) {
    return;
  }
  rStream = iStream.js2dest(gulp.src(util.joinFormat(config.alias.srcRoot, 'js/lib/**/*.js')));
  rStream = rStream
    .pipe(fn.blankPipe((file) => {
      fn.logDest(util.path.join(config.alias.jslibDest, file.relative));
    }))
    .pipe(gulp.dest(config.alias.jslibDest));

  return rStream;
});

gulp.task('data-task', () => {
  if (cache.isError) {
    return;
  }
  return gulp.src([util.joinFormat(config.alias.srcRoot, 'js/**/*.json')])
    .pipe(fn.blankPipe((file) => {
      fn.logDest(util.path.join(config.alias.jsDest, file.relative));
    }))
    .pipe(gulp.dest( config.alias.jsDest ));
});

// - js task

// + concat task
gulp.task('concat', (done) => {
  if (!config.concat) {
    return done();
  }
  if (cache.isError) {
    return done();
  }

  supercall.concat(iEnv).then(() => {
    done();
  });
});
gulp.task('concat-js', (done) => {
  if (!config.concat) {
    return done();
  }
  if (cache.isError) {
    return done();
  }
  supercall.concatJs(iEnv).then(() => {
    done();
  });
});
gulp.task('concat-css', (done) => {
  if (!config.concat) {
    return done();
  }
  if (cache.isError) {
    return done();
  }

  supercall.concatCss(iEnv).then(() => {
    done();
  });
});
// - concat task

// + resource
gulp.task('resource', (done) => {
  if (!config.resource) {
    return done();
  }
  if (cache.isError) {
    return done();
  }
  supercall.resource(iEnv).then(() => {
    done();
  });
});
// - resource


// + rev
gulp.task('rev-build', (done) => {
  if (cache.isError) {
    return done();
  }
  supercall.rev.build(iEnv).then(() => {
    done();
  });
});

gulp.task('rev-update', (done) => {
  if (cache.isError) {
    return done();
  }
  supercall.rev.update(iEnv).then(() => {
    done();
  });
});
// - rev




// + watch task
gulp.task('watch', ['all'], () => {
  var
    watchit = function(glob, op, fn) {
      if (arguments.length == 3) {
        return watch(glob, op, util.debounce(fn, 500));
      } else {
        fn = op;
        return watch(glob, util.debounce(fn, 500));
      }
    };

  watchit(util.joinFormat(config.alias.srcRoot, '**/**.*'), (file) => {
    log('clear');
    log('start', 'watch');
    var runtimeFiles = fn.srcRelative(file.history, {
      base: config.alias.srcRoot,
      jslib: util.joinFormat(config.alias.srcRoot, 'js/lib'),
      rConfig: util.joinFormat(config.alias.srcRoot, 'js/rConfig/rConfig.js')
    });


    const htmlDestFiles = [];
    const tplDestFiles = [];

    var streamCheck = function() {
      if (!total) {
        log('msg', 'success', 'optimize finished');
        runSequence(['concat', 'resource'],  () => {
          new util.Promise((next) => {
            if (htmlDestFiles.length && iEnv.isCommit) {
              let rStream = iStream
                .inline2dest(gulp.src(htmlDestFiles, {
                  base: config.alias.htmlDest
                }))
                .pipe(fn.blankPipe((file) => {
                  fn.logDest(util.path.join(file.base, file.relative));
                }))
                .pipe(gulp.dest(config.alias.htmlDest));

              rStream.on('finish', () => {
                next();
              });
            } else {
              next();
            }
          }).then((next) => {
            if (tplDestFiles.length && config.alias.tplDest && iEnv.isCommit) {
              let rStream = iStream
                .inline2dest(gulp.src(tplDestFiles, {
                  base: config.alias.tplDest
                }))
                .pipe(fn.blankPipe((file) => {
                  fn.logDest(util.path.join(file.base, file.relative));
                }))
                .pipe(gulp.dest(config.alias.tplDest));

              rStream.on('finish', () => {
                next();
              });
            } else {
              next();
            }
          }).then(() => {
            runSequence('rev-update', () => {
              supercall.livereload();
              log('msg', 'success', 'watch task finished');
              log('finish');
            });
          }).start();
        });
      }
    };

    var total = runtimeFiles.length;

    if (total == 0) {
      streamCheck();
    }

    runtimeFiles.forEach((iPath) => {
      var
        rStream = iStream.any2dest(iPath, {
          base: config.alias.srcRoot
        });

      if (rStream) {
        rStream.pipe(fn.blankPipe((file) => {
          const iPath = util.path.join(file.base, file.relative);
          if (fn.pathInside(config.alias.tplDest, iPath)) {
            tplDestFiles.push(iPath);
          } else if (fn.pathInside(config.alias.htmlDest, iPath)) {
            htmlDestFiles.push(iPath);
          }
        }));
        rStream = iStream.dest2dest(rStream, {
          base: config.alias.srcRoot,
          staticRemotePath: iEnv.staticRemotePath,
          mainRemotePath: iEnv.mainRemotePath,
          revPath: util.joinFormat(config.alias.revDest, 'rev-manifest.json'),
          revRoot: config.alias.revRoot,
          destRoot: config.alias.destRoot,
          srcRoot: config.alias.srcRoot,
          cssDest: config.alias.cssDest,
          htmlDest: config.alias.htmlDest,
          tplDest: config.alias.tplDest,
          root: config.alias.root
        });
        rStream.on('finish', () => {
          total--;
          streamCheck();
        });
      } else {
        total--;
        streamCheck();
      }
    });
  });

  supercall.watchDone(iEnv);
});
// - watch task

// + all
gulp.task('all', ['js', 'css', 'images', 'html', 'tpl', 'resource'], (done) => {
  runSequence('inline-source', 'rev-build', () => {
    if (!iEnv.silent) {
      util.pop('all task done');
    }
    done();
  });
});


gulp.task('watchAll', ['watch']);
// - all

const opzer = {
  help: function() {
    return new Promise((next) => {
      util.help({
        usage: 'yyl',
        commands: {
          'all': 'optimize task',
          'js': 'optimize task',
          'css': 'optimize task',
          'images': 'optimize task',
          'watch': 'watch task'
        },
        options: {
          '--remote' : 'use remote revfile',
          '--sub': 'svn branches',
          '--nooptimize': 'commit the project to svn without optimize',
          '--name': 'name of projects',
          '--config': 'use the val config path'
        }
      });
      next();
    });
  },
  js: function() {
    return new Promise((next) => {
      log('start', 'optimize');
      gulp.start('js', () => {
        log('finish');
        next();
      });
    });
  },
  html: function() {
    return new Promise((next) => {
      log('start', 'optimize');
      gulp.start('html', () => {
        log('finish');
        next();
      });
    });
  },
  css: function() {
    return new Promise((next) => {
      log('start', 'optimize');
      gulp.start('css', () => {
        log('finish');
        next();
      });
    });
  },
  images: function() {
    return new Promise((next) => {
      log('start', 'optimize');
      gulp.start('images', () => {
        log('finish');
        next();
      });
    });
  },
  resource: function() {
    return new Promise((next) => {
      log('start', 'optimize');
      gulp.start('resource', () => {
        log('finish');
        next();
      });
    });
  },
  tpl: function() {
    return new Promise((next) => {
      log('start', 'optimize');
      gulp.start('tpl', () => {
        log('finish');
        next();
      });
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
  rev: function() {
    return new Promise((next) => {
      log('start', 'optimize');
      gulp.start('rev-build', () => {
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

    iEnv.staticRemotePath = (iEnv.remote || iEnv.isCommit) ? (config.commit.staticHost || config.commit.hostname) : '/';
    iEnv.mainRemotePath = (iEnv.remote || iEnv.isCommit) ? (config.commit.mainHost || config.commit.hostname) : '/';

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
