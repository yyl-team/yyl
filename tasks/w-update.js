'use strict';
var util = require('./w-util.js');
var fs = require('fs');
var path = require('path');

var
  REG = {
    IS_VERSION: /^\d+\.\d+\.\d+$/,
    PACKAGE: /package\.json$/,
    PACKAGE_LOCK: /package-lock\.json$/,
    NODE_MODULES: /node_modules/
  },
  INTERFACE = {
    NPM_DOWNLOAD: 'https://registry.npmjs.org/{$name}/-/{$name}-{$version}.tgz',
    NPM_INSTALL: 'npm install {$name}@{$version}',
    VERSION: '~{$version}'
  },
  GIT_PATH = 'https://github.com/jackness1208/yyl.git',
  fn = {
    printIt: function(iPath) {
      return path.relative(util.vars.BASE_PATH, iPath);
    },
    render: function(src, obj) {
      if (src && obj) {
        return src.replace(/\{\$(\w+)\}/g, function(str, $1) {
          if (obj[$1]) {
            return obj[$1];
          } else {
            return '';
          }
        });
      } else {
        return src;
      }
    }
  };

var
  update = {
    help: function() {
      util.help({
        usage: 'yyl update <package> <version>',
        options: {
          'package': 'package name in yyl',
          'version': 'package version in yyl'
        }
      });
    },
    package: function(name, version) {
      if (!name || !version) {
        return update.help();
      }

      if (!version.match(REG.IS_VERSION)) {
        return util.msg.error('version is not meet the rules:', version);
      }

      var packages = [];
      var packageLocks = [];
      var count = 0;

      util.readFilesSync(util.vars.BASE_PATH, function(iPath) {
        var relativePath = util.joinFormat( path.relative(util.vars.BASE_PATH, iPath) );
        if (relativePath.match(REG.NODE_MODULES)) {
          return;
        } else if (relativePath.match(REG.PACKAGE)) {
          packages.push(iPath);
        } else if (relativePath.match(REG.PACKAGE_LOCK)) {
          packageLocks.push(iPath);
        }
      });

      packages.forEach(function(iPath) {
        if (!fs.existsSync(iPath)) {
          return;
        }

        var pkg = util.requireJs(iPath);
        var isUpdate = false;

        if (!pkg) {
          return;
        }

        if (pkg.dependencies) {
          Object.keys(pkg.dependencies).forEach(function(key) {
            if (key == name) {
              var r = fn.render(INTERFACE.VERSION, { 'version': version });
              if (pkg.dependencies[key] != r) {
                pkg.dependencies[key] = r;
                isUpdate = true;
              }
              return true;
            }
          });
        }

        if (pkg.devDependencies) {
          Object.keys(pkg.devDependencies).forEach(function(key) {
            if (key == name) {
              var r = fn.render(INTERFACE.VERSION, { 'version': version });
              if (pkg.devDependencies[key] != r) {
                pkg.devDependencies[key] = r;
                isUpdate = true;
                return true;
              }
            }
          });
        }

        if (isUpdate) {
          fs.writeFileSync(iPath, JSON.stringify(pkg, null, 2));
          util.msg.update(fn.printIt(iPath));
          count++;
        }
      });

      packageLocks.forEach(function(iPath) {
        if (!fs.existsSync(iPath)) {
          return;
        }

        var pkg = util.requireJs(iPath);
        var isUpdate = false;

        if (!pkg) {
          return;
        }

        if (pkg.dependencies) {
          Object.keys(pkg.dependencies).forEach(function(key) {
            if (key == name) {
              if (pkg.dependencies[key].version != version) {
                pkg.dependencies[key].version = version;
                isUpdate = true;
              }

              var r = fn.render(INTERFACE.NPM_DOWNLOAD, {
                'name': key,
                'version': version
              });

              if (pkg.dependencies[key].resolved != r) {
                pkg.dependencies[key].resolved = r;
                isUpdate = true;
              }
              return true;
            }
          });
        }

        if (pkg.devDependencies) {
          Object.keys(pkg.devDependencies).forEach(function(key) {
            if (key == name) {
              if (pkg.devDependencies[key].version != version) {
                pkg.devDependencies[key].version = version;
                isUpdate = true;
              }

              var r = fn.render(INTERFACE.NPM_DOWNLOAD, {
                'name': key,
                'versioin': version
              });
              if (pkg.devDependencies[key].resolved != r) {
                pkg.devDependencies[key].resolved = r;
                isUpdate = true;
              }
              return true;
            }
          });
        }

        if (isUpdate) {
          fs.writeFileSync(iPath, JSON.stringify(pkg, null, 2));
          util.msg.update(fn.printIt(iPath));
          count++;
        }
      });

      util.msg.line().info('update finished');
      util.msg.success('updated ' + count + ' files');
      util.msg.warn('please input the following cmd by yourself:');
      util.msg.warn(fn.render(INTERFACE.NPM_INSTALL, { 'name': name, 'version': version }));
    },
    yyl: function(version) {
      var UPDATE_ERR_MSG = 'udpate error, please run "npm i yyl -g" manual';
      new util.Promise(function(NEXT) {
        // 如果有 git 就直接 git 命令更新
        if (fs.existsSync(util.path.join(util.vars.SERVER_UPDATE_PATH, '.git'))) {
          var iCmd = 'git checkout master & git pull';
          if (version) {
            iCmd = 'git checkout '+ version +' & git pull';
          }
          util.msg.info('update start...');
          util.runCMD(iCmd, function(err) {
            if (err) { // 出错则需要清空后重试
              util.removeFiles(util.vars.SERVER_UPDATE_PATH, function() {
                update.yyl(version);
              });
            } else {
              NEXT();
            }
          }, util.vars.SERVER_UPDATE_PATH);
        } else { // 否则就 用 git clone
          new util.Promise(function(next) {
            if (fs.existsSync(util.vars.SERVER_UPDATE_PATH)) { // 先清空目录
              util.removeFiles(util.vars.SERVER_UPDATE_PATH, function() {
                next();
              });
            } else {
              util.mkdirSync(util.vars.SERVER_UPDATE_PATH);
              next();
            }
          }).then(function() { // 执行 git clone
            var iCmd = 'git clone ' + GIT_PATH + ' ' + util.vars.SERVER_UPDATE_PATH;
            if (version) {
              iCmd = 'git clone -b ' + version + ' ' + GIT_PATH + ' ' + util.vars.SERVER_UPDATE_PATH;
            }

            util.msg.info('update start...');
            util.runCMD(iCmd, function(err) {
              if (err) {
                console.log(err);
                if (version) {
                  util.msg.error('version is not exist', version);
                } else {
                  util.msg.warn(UPDATE_ERR_MSG);
                }
              } else {
                NEXT();
              }
            }, util.vars.SERVER_UPDATE_PATH);
          }).start();
        }
      }).then(function(next) { // package 校验
        var updatePackagePath = util.path.join(util.vars.SERVER_UPDATE_PATH, 'package.json');
        var basePackagePath = util.path.join(util.vars.BASE_PATH, 'package.json');

        if (!fs.existsSync(updatePackagePath)) {
          util.msg.error('path is not exists', updatePackagePath);
          return util.msg.warn(UPDATE_ERR_MSG);
        } else if (!fs.existsSync(basePackagePath)) {
          util.msg.error('path is not exists', basePackagePath);
          return util.msg.warn(UPDATE_ERR_MSG);
        }

        var updatePackage = util.requireJs(updatePackagePath);
        var basePackage = util.requireJs(basePackagePath);
        var isNotMatch = false;

        if (basePackage.version === updatePackage.version) {
          return util.msg.warn('yyl already the latest:', updatePackage.version);
        } else {
          Object.keys(updatePackage.dependencies).forEach(function(key) {
            if (updatePackage.dependencies[key] != basePackage.dependencies[key]) {
              isNotMatch = 'dependencies ' + key;
              return true;
            }
          });

          Object.keys(updatePackage.devDependencies).forEach(function(key) {
            if (updatePackage.devDependencies[key] !=
                            basePackage.devDependencies[key]) {
              isNotMatch = 'devDependencies ' + key;
              return true;
            }
          });

          if (isNotMatch) {
            return util.msg.warn('the latest yyl package ' + isNotMatch + ' changed, please run "npm i yyl -g" manual');
          } else {
            next();
          }
        }
      }).then(function(next) { // copy files
        var updatePath = util.vars.SERVER_UPDATE_PATH;

        if (!fs.existsSync(updatePath)) {
          util.msg.error('path is not exists', updatePath);
          return util.msg.warn(UPDATE_ERR_MSG);
        }

        util.copyFiles(updatePath, util.vars.BASE_PATH, function(err) {
          if (err) {
            return util.msg.warn(UPDATE_ERR_MSG);
          } else {
            next();
          }
        }, function(iPath) { // 除去 根目录的 package.json 和 .git, .gitignore
          if (util.path.join(iPath) == util.path.join(updatePath, 'package.json') || /(\.git$|\.gitignore$|\.git[/\\])/.test(iPath)) {
            return false;
          } else {
            return true;
          }
        }, null);
      }).then(function(next) { // 单独 update .npmignore
        var cp = {};
        util.readFilesSync(util.vars.SERVER_UPDATE_PATH, /\.gitignore/).forEach(function(iPath) {
          var targetPath = util.path.join(
            util.vars.BASE_PATH,
            util.path.relative(util.vars.SERVER_UPDATE_PATH, iPath)
          );

          targetPath = targetPath.replace(/\.gitignore$/, '.npmignore');
          cp[iPath] = targetPath;
        });

        util.copyFiles(cp, function(err) {
          if (err) {
            console.log(err);
            return util.msg.warn(UPDATE_ERR_MSG);
          } else {
            next();
          }
        });
      }).then(function() {
        util.msg.success('yyl update finished');
      }).start();
    },
    run: function(ctx, version) {
      if (ctx) {
        if (ctx.match(REG.IS_VERSION)) { // 正常组件升级
          update.yyl(ctx);
        } else if (version) { // package 更新 开发用功能
          update.package(ctx, version);
        } else {
          update.help();
        }
      } else {
        update.yyl();
      }
    }
  };

module.exports = update;





