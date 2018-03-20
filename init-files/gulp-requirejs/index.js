'use strict';
const path = require('path');
const fs = require('fs');
const querystring = require('querystring');
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


var fn = {
  finishCallback: function() {
    return global.YYL_RUN_CALLBACK && global.YYL_RUN_CALLBACK();
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
      var pagePath = util.joinFormat(op.base, 'components/p-');
      var sameName = false;

      iPath.replace(/p-([a-zA-Z0-9-]+)\/p-([a-zA-Z0-9-]+)\.\w+$/, (str, $1, $2) => {
        sameName = $1 === $2;
        return str;
      });
      return sameName && pagePath == iPath.substr(0, pagePath.length);
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

          if (isPage(iPath)) {
            r.push(iPath);
          }

          rs.forEach((rPath) => {
            if (isPage(rPath)) {
              r.push(rPath);
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

          if (isPage(iPath)) { // 如果自己是 p-xx 文件 也添加到 返回 array
            r.push(iPath);
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


          if (/p-[a-zA-Z0-9-]+\/p-[a-zA-Z0-9-]+\.pug$/.test(iPath)) { // 如果自己是 p-xx 文件 也添加到 返回 array
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

          if (isPage(iPath)) { // 如果自己是 p-xx 文件 也添加到 返回 array
            r.push(iPath);
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
    var hostRoot = util.joinFormat(
      op.remotePath,
      path.relative(op.destRoot, op.revRoot)
    );
    // 根据地址 返回 输出目录内带有 remote 和 hash 的完整地址
    var getRevMapDest = function(iPath) {
      var revSrc = util.joinFormat(path.relative(op.revRoot, iPath));
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
        case 'js':
        case 'css': // 查找调用这文件的 html
          searchFiles = util.readFilesSync(op.root, /\.html$/);
          break;
        default:
          if (fn.isImage(iPath)) { // 查找调用这文件的 html, css
            searchFiles = util.readFilesSync(op.root, /\.(html|css)$/);
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
  }
};

var REG = {
  HTML_PATH_REG: /(src|href|data-main|data-original)(\s*=\s*)(['"])([^'"]*)(["'])/ig,
  HTML_SCRIPT_REG: /(<script[^>]*>)([\w\W]*?)(<\/script>)/ig,
  HTML_IGNORE_REG: /^(about:|data:|javascript:|#|\{\{)/,
  HTML_SCRIPT_TEMPLATE_REG: /type\s*=\s*['"]text\/html["']/,
  HTML_ALIAS_REG: /^(\{\$)(\w+)(\})/g,
  HTML_IS_ABSLUTE: /^\//,

  HTML_STYLE_REG: /(<style[^>]*>)([\w\W]*?)(<\/style>)/ig,
  HTML_SRC_COMPONENT_JS_REG: /^\.\.\/components\/p-[a-zA-Z0-9-]+\/p-([a-zA-Z0-9-]+).js/g,

  HTML_SRC_COMPONENT_IMG_REG: /^\.\.\/(components\/[pwr]-[a-zA-Z0-9-]+\/images)/g,

  CSS_PATH_REG: /(url\s*\(['"]?)([^'"]*?)(['"]?\s*\))/ig,
  CSS_PATH_REG2: /(src\s*=\s*['"])([^'" ]*?)(['"])/ig,
  CSS_IGNORE_REG: /^(about:|data:|javascript:|#|\{\{)/,
  CSS_IS_ABSLURE: /^\//,

  JS_DISABLE_AMD: /\/\*\s*amd\s*:\s*disabled\s*\*\//,

  IS_HTTP: /^(http[s]?:)|(\/\/\w)/
};

var
  iStream = {
    // + html task
    pug2html: function(stream) {
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
          log('msg', 'error', er.message);
          log('finish');
          process.exit(1);
        }))
        .pipe(through.obj(function(file, enc, next) {
          var dirname = util.joinFormat( config.alias.srcRoot, 'html');

          inlinesource({
            content: file.contents,
            baseUrl: path.dirname(path.join(file.base, file.relative)),
            publishPath: dirname,
            type: 'html',
            alias: config.alias,
            onReplacePath: function (iPath) {
              if (path.extname(iPath) == '.scss') { // 纠正 p-xx.scss 路径
                const filename = path.basename(iPath, path.extname(iPath));
                if (/^p-/.test(filename)) {
                  iPath = util.path.relative(
                    dirname,
                    path.join(config.alias.srcRoot, 'css', `${filename.replace(/^p-/, '')  }.css`)
                  );
                }
              }
              return iPath;
            }
          }).then((iCnt) => {
            file.contents = Buffer.from(iCnt, 'utf-8');
            this.push(file);
            next();
          });
        }))
        .pipe(rename((path) => {
          path.basename = path.basename.replace(/^p-/g, '');
          path.dirname = '';
        }))
        .pipe(prettify({indent_size: 4}));
        // .pipe(gulp.dest(util.joinFormat(config.alias.srcRoot, 'html')));

      return rStream;
    },
    html2dest: function(stream) {
      var relateHtml = function(iPath) {
        return util.joinFormat(
          path.relative(
            path.join(config.alias.srcRoot, 'html'),
            iPath
          )
        );
      };

      var remotePath = iEnv.remotePath;


      // html task
      var rStream = stream
        .pipe(plumber())
        // 删除requirejs的配置文件引用
        .pipe(replacePath(/<script [^<]*local-usage><\/script>/g, ''))

        // 将用到的 commons 目录下的 images 资源引入到项目里面
        .pipe(through.obj(function(file, enc, next) {
          var iCnt = file.contents.toString();
          var gComponentPath = relateHtml(config.alias.globalcomponents);
          var copyPath = {};


          var filterHandle = function(str, $1, $2, $3, $4) {
            var iPath = $4;

            if (iPath.match(REG.HTML_IGNORE_REG) || iPath.match(REG.IS_HTTP)) {
              return str;
            }


            if (iPath.substr(0, gComponentPath.length) != gComponentPath) {
              return str;
            }

            var dirname = iPath.substr(gComponentPath.length);

            copyPath[util.joinFormat(config.alias.srcRoot, 'html', iPath)] = util.joinFormat(config.alias.imagesDest, 'globalcomponents', dirname);
            return str;
          };

          iCnt.replace(REG.HTML_PATH_REG, filterHandle);

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
          var iCnt = file.contents.toString();

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

              if (iPath.match(REG.HTML_IGNORE_REG) || iPath.match(REG.IS_HTTP) || !iPath) {
                return str;
              }

              rPath = iPath;

              // 替换指向 dest 目录的路径
              if (fn.matchFront(rPath, `${relateHtml(config.alias.destRoot)}/`)) {
                rPath = rPath
                  .split(`${relateHtml(config.alias.destRoot)}/`)
                  .join(util.joinFormat(remotePath));
              }

              // 替换全局 图片
              if (fn.matchFront(rPath, relateHtml(config.alias.globalcomponents))) {
                rPath = rPath
                  .split(relateHtml(config.alias.globalcomponents))
                  .join(util.joinFormat(remotePath, fn.relateDest(config.alias.imagesDest), 'globalcomponents'));
              }

              // 替换 common 下 lib
              if (fn.matchFront(rPath, relateHtml(config.alias.globallib))) {
                rPath = rPath
                  .split(relateHtml(config.alias.globallib))
                  .join(util.joinFormat(remotePath, fn.relateDest(config.alias.jslibDest), 'globallib'));
              }

              // 替换 jslib
              if (fn.matchFront(rPath, '../js/lib')) {
                rPath = rPath
                  .split('../js/lib')
                  .join(util.joinFormat(remotePath, fn.relateDest(config.alias.jslibDest)));
              }

              // 替换 js
              if (fn.matchFront(rPath, '../js')) {
                rPath = rPath
                  .split('../js')
                  .join(util.joinFormat(remotePath, fn.relateDest(config.alias.jsDest)));
              }

              // 替换 components 中的js
              rPath = rPath.replace(REG.HTML_SRC_COMPONENT_JS_REG, util.joinFormat( remotePath, fn.relateDest(config.alias.jsDest), '/$1.js'));

              // 替换 css
              if (fn.matchFront(rPath, '../css')) {
                rPath = rPath
                  .split('../css')
                  .join(util.joinFormat( remotePath, fn.relateDest(config.alias.cssDest)));
              }

              // 替换公用图片
              if (fn.matchFront(rPath, '../images')) {
                rPath = rPath
                  .split('../images')
                  .join(util.joinFormat( remotePath, fn.relateDest(config.alias.imagesDest)));
              }

              rPath = rPath.replace(REG.HTML_SRC_COMPONENT_IMG_REG, util.joinFormat( remotePath, fn.relateDest(config.alias.imagesDest), '$1'));

              // 替换 config.resource 里面的路径
              var resource = config.resource;
              if (resource) {
                Object.keys(resource).forEach((key) => {
                  if (fn.matchFront(rPath, relateHtml(key))) {
                    rPath = rPath
                      .split(relateHtml(key))
                      .join(util.joinFormat(remotePath, fn.relateDest(resource[key])));
                  }
                });
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
        // 把用到的 commons 目录下的 js 引入到 项目的 lib 底下
        .pipe(through.obj(function(file, enc, next) {
          file.contents.toString()
            .replace(new RegExp(`['"]${ util.joinFormat(remotePath, fn.relateDest(config.alias.jslibDest), 'globallib') }([^'"]*)["']`, 'g'), (str, $1) => {
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
    // + css task
    sassBase2css: function(stream) {
      var
        rStream = stream
          .pipe(plumber())
          .pipe(sass({outputStyle: 'nested'}).on('error', (err) => {
            log('msg', 'error', err.message);
            log('finish');
            process.exit(1);
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
            log('msg', 'error', err.message);
            log('finish');
            process.exit(1);
          }))
          .pipe(through.obj(function(file, enc, next) {
            var iCnt = file.contents.toString();
            var dirname = util.joinFormat(config.alias.srcRoot, 'css');

            var replaceHandle = function(str, $1, $2, $3) {
              var iPath = $2;
              var rPath = '';

              if (iPath.match(REG.CSS_IGNORE_REG)) {
                return str;
              }

              if (iPath.match(REG.IS_HTTP) || iPath.match(REG.CSS_IS_ABSLURE)) {
                return str;
              }


              var fDirname = path.dirname(path.relative(dirname, file.path));
              rPath = util.path.join(fDirname, iPath);

              var rPath2 = util.path.join(dirname, iPath);

              if (fs.existsSync(fn.hideUrlTail(util.path.join(dirname, rPath)))) { // 以当前文件所在目录为 根目录查找文件
                return $1 + rPath + $3;
              } else if (fs.existsSync(fn.hideUrlTail(rPath2))) { // 如果直接是根据生成的 css 目录去匹配 也允许
                return str;
              } else {
                log('msg', 'warn', [
                  `css url replace error, ${path.basename(file.history.toString())}`,
                  `  path not found: ${chalk.yellow(util.path.relative(util.vars.PROJECT_PATH, fn.hideUrlTail(util.joinFormat(dirname, rPath))))}`
                ].join('\n'));
                return str;
              }
            };


            iCnt = iCnt
              .replace(REG.CSS_PATH_REG, replaceHandle)
              .replace(REG.CSS_PATH_REG2, replaceHandle);

            file.contents = Buffer.from(iCnt, 'utf-8');
            this.push(file);
            next();
          }))
          .pipe(rename((path) => {
            path.dirname = '';
            path.basename = path.basename.replace(/^p-/, '');
          }));
      // .pipe(gulp.dest(util.joinFormat(config.alias.srcRoot, 'css')));
      return rStream;
    },
    css2dest: function(stream) {
      var remotePath = iEnv.remotePath;
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
              .replace(REG.CSS_PATH_REG, filterHandle)
              .replace(REG.CSS_PATH_REG2, filterHandle);

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
            var filterHandle = function(str, $1, $2, $3) {
              var iPath = $2;

              if (iPath.match(REG.CSS_IGNORE_REG) || iPath.match(REG.IS_HTTP) || !iPath) {
                return str;
              }

              var rPath = iPath;

              // 替换 commons components 里面的 图片
              if (fn.matchFront(rPath, relateCss(config.alias.globalcomponents))) {
                rPath = rPath
                  .split(relateCss(config.alias.globalcomponents))
                  .join(util.joinFormat(remotePath, fn.relateDest(path.join(config.alias.imagesDest, 'globalcomponents'))));
              }

              // 替换图片
              if (fn.matchFront(rPath, '../images')) {
                rPath = rPath
                  .split('../images')
                  .join(util.joinFormat(remotePath, fn.relateDest(config.alias.imagesDest)));
              }

              // 替换 components 内图片
              if (fn.matchFront(rPath, '../components')) {
                rPath = rPath
                  .split('../components')
                  .join(util.joinFormat( remotePath, fn.relateDest( path.join(config.alias.imagesDest, 'components'))));
              }

              // 替换 config.resource 里面的路径
              var resource = config.resource;
              if (resource) {
                Object.keys(resource).forEach((key) => {
                  if (fn.matchFront(rPath, relateCss(key))) {
                    rPath = rPath
                      .split(relateCss(key))
                      .join(util.joinFormat(remotePath, fn.relateDest(resource[key])));
                  }
                });
              }

              return `${$1}${rPath}${$3}`;
            };

            iCnt = iCnt
              .replace(REG.CSS_PATH_REG, filterHandle)
              .replace(REG.CSS_PATH_REG2, filterHandle);

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
            if (iCnt.split(REG.JS_DISABLE_AMD).length > 1) {
              log('msg', 'optimize', util.path.join(file.base, file.relative));
              self.push(file);
              cb();
            } else {
              var optimizeOptions = {
                mainConfigFile: util.joinFormat(config.alias.srcRoot, 'js/rConfig/rConfig.js'),
                logLevel: 2,
                baseUrl: path.dirname(util.joinFormat(config.alias.srcRoot, file.relative)),
                generateSourceMaps: false,
                optimize: 'none',
                include: util.joinFormat(path.relative(util.joinFormat(config.alias.srcRoot, 'js/rConfig'), util.joinFormat(config.alias.srcRoot, file.relative))),
                out: function(text) {
                  file.contents = Buffer.from(text, 'utf-8');
                  self.push(file);
                  cb();
                }
              };

              log('msg', 'optimize', util.path.join(file.base, file.relative));
              requirejs.optimize(optimizeOptions, null, (err) => {
                if (err) {
                  log('msg', 'error', err.originalError.message);
                  log('finish');
                  process.exit(1);
                }
                cb();
              });
            }
          }))
          .pipe(iEnv.isCommit ? uglify() : fn.blankPipe())
          .pipe(rename((path) => {
            path.basename = path.basename.replace(/^[pj]-/g, '');
            path.dirname = '';
          }));
      return rStream;
    },
    js2dest: function(stream) {
      var
        rStream = stream
          .pipe(plumber())
          .pipe(iEnv.isCommit ? uglify() : fn.blankPipe());

      return rStream;
    },
    // - js task
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
          var rStream = iStream.any2dest(iPath);

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
    any2dest: function(iPath) {
      var iExt = path.extname(iPath).replace(/^\./, '');
      var inside = function(rPath) {
        return fn.pathInside(util.joinFormat(config.alias.srcRoot, rPath), iPath);
      };
      var rStream;

      switch (iExt) {
        case 'pug':
        case 'jade':
          if (inside('components')) { // pug-to-dest-task
            rStream = iStream.pug2dest(gulp.src([iPath], {
              base: util.joinFormat(config.alias.srcRoot, 'components')
            }));
            rStream = rStream
              .pipe(fn.blankPipe((file) => {
                fn.logDest(util.path.join(config.alias.htmlDest, file.relative));
              }))
              .pipe(gulp.dest(config.alias.htmlDest));
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
  var rStream;

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

  rStream = iStream.html2dest(gulp.src(util.joinFormat(config.alias.srcRoot, 'html/*.html')));
  rStream = rStream
    .pipe(fn.blankPipe((file) => {
      fn.logDest(util.path.join(config.alias.htmlDest, file.relative));
    }))
    .pipe(gulp.dest(config.alias.htmlDest));

  return rStream;
});
// - html task

// + css task
gulp.task('css', ['sass-component-to-dest', 'sass-base-to-dest', 'css-to-dest'], (done) => {
  runSequence('concat-css', done);
});
gulp.task('sass-component-to-dest', () => {
  var rStream;

  rStream = iStream.sassComponent2dest(
    gulp.src(path.join(config.alias.srcRoot, 'components/@(p-)*/*.scss'), {
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

  rStream = iStream.requirejs2dest(gulp.src([
    util.joinFormat(config.alias.srcRoot, 'components/p-*/p-*.js'),
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
  rStream = iStream.js2dest(gulp.src(util.joinFormat(config.alias.srcRoot, 'js/lib/**/*.js')));
  rStream = rStream
    .pipe(fn.blankPipe((file) => {
      fn.logDest(util.path.join(config.alias.jslibDest, file.relative));
    }))
    .pipe(gulp.dest(config.alias.jslibDest));

  return rStream;
});

gulp.task('data-task', () => {
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

  supercall.concat(iEnv).then(() => {
    done();
  });
});
gulp.task('concat-js', (done) => {
  if (!config.concat) {
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
    var streamCheck = function() {
      if (!total) {
        log('msg', 'success', 'optimize finished');
        runSequence(['concat', 'resource'], 'rev-update', () => {
          supercall.livereload();
          log('msg', 'success', 'watch task finished');
          log('finish');
        });
      }
    };

    var total = runtimeFiles.length;

    runtimeFiles.forEach((iPath) => {
      var
        rStream = iStream.any2dest(iPath);

      if (rStream) {
        rStream = iStream.dest2dest(rStream, {
          remotePath: iEnv.remotePath,
          revPath: util.joinFormat(config.alias.revDest, 'rev-manifest.json'),
          revRoot: config.alias.revRoot,
          destRoot: config.alias.destRoot,
          srcRoot: config.alias.srcRoot,
          cssDest: config.alias.cssDest,
          htmlDest: config.alias.htmlDest,
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
gulp.task('all', (done) => {
  runSequence(['js', 'css', 'images', 'html', 'resource'], 'rev-build',  () => {
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
