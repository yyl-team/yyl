'use strict';
var path = require('path');
var fs = require('fs');
var inquirer = require('inquirer');

var color = require('yyl-color');
var util = require('./w-util.js');
var wServer = require('./w-server');
var log = require('./w-log.js');

var
  events = {
    help: function() {
      util.help({
        usage: 'yyl init',
        options: {
          '-h, --help': 'print usage information',
          '-f': 'init forcibly',
          '--name': 'project name',
          '--platform': 'platform: pc or mobile',
          '--workflow': 'workflow type',
          '--init': 'workflow init type',
          '--doc': 'git or svn documents path init',
          '--cwd': 'runtime path',
          '--nonpm': 'init without npm install'
        }
      });
    },
    init: function(op) {
      // 信息收集
      new util.Promise(((next) => {
        var data = {};
        var prompt = inquirer.createPromptModule();
        var questions = [];

        if (op.name) {
          data.name = op.name;
        } else {
          questions.push({
            name: 'name',
            message: 'name',
            type: 'input',
            default: util.vars.PROJECT_PATH.split('/').pop()
          });
        }

        if (op.platform && /^pc|mobile$/.test(op.platform)) {
          data.platform = op.platform;
        } else {
          questions.push({
            name: 'platform',
            message: 'platform',
            type: 'list',
            choices: ['pc', 'mobile'],
            default: ['pc']
          });
        }

        if (questions.length) {
          data.confirm = true;
          prompt(questions, (d) => {
            next(util.extend(data, d));
          });
        } else {
          next(data);
        }
      })).then((data, next) => {
        if (!data.commonPath) {
          data.commonPath = util.joinFormat(util.vars.PROJECT_PATH, '../commons');
        }

        data.commonPath = data.commonPath.trim();

        next(data);
      }).then((data, next) => { // workflow
        var prompt = inquirer.createPromptModule();
        var questions = [];
        var workflows = util.readdirSync(path.join(__dirname, '../init-files'), /^\./);
        var iQuestion = {
          name: 'workflow',
          type: 'list',
          message: 'workflow',
          choices: workflows
        };

        if (data.platform == 'pc') {
          iQuestion.default = 'gulp-requirejs';
        } else {
          iQuestion.default = 'webpack-vue';
        }

        if (op.workflow && ~workflows.indexOf(op.workflow)) {
          data.workflow = op.workflow;
        } else {
          questions.push(iQuestion);
        }

        if (questions.length) {
          data.confirm = true;
          prompt(questions, (d) => {
            next(util.extend(data, d));
          });
        } else {
          next(data);
        }
      }).then((data, next) => { // workflow resetFiles init
        var prompt = inquirer.createPromptModule();
        var questions = [];

        if (data.workflow) {
          var workFlowExpPath = path.join(__dirname, '../examples', data.workflow);
          var expType = [];

          if (fs.existsSync(workFlowExpPath)) {
            expType = util.readdirSync(workFlowExpPath, /^\./);
            if (op.init && ~expType.indexOf(op.init)) {
              data.init = op.init;
            } else {
              questions.push({
                name: 'init',
                message: 'workflow init type',
                type: 'list',
                choices: expType,
                default: 'single-project'
              });
            }

            if (questions.length) {
              data.confirm = true;
              prompt(questions, (d) => {
                next(util.extend(data, d));
              });
            } else {
              next(data);
            }
          } else {
            util.msg.error('file not exist:', workFlowExpPath);
            next(data);
          }
        } else {
          next(data);
        }
      }).then((data, next) => { // doc reset
        var prompt = inquirer.createPromptModule();
        var questions = [];
        var iType = {
          'git': 'git path (just project)',
          'svn': 'svn path (full svn)'
        };

        if (op.doc && iType[op.doc]) {
          data.doc = iType[op.doc];
        } else {
          questions.push({
            name: 'doc',
            message: 'select init type',
            type: 'list',
            choices: Object.keys(iType).map((key) => {
              return iType[key];
            }),
            default: iType.git
          });
        }

        if (questions.length) {
          data.confirm = true;
          prompt(questions, (d) => {
            next(util.extend(data, d));
          });
        } else {
          next(data);
        }
      }).then((data, next) => {
        data.version = util.requireJs(path.join(util.vars.BASE_PATH, 'package.json')).version;

        if (!op.silent && data.confirm) {
          // 基本信息
          console.log([
            '',
            ' project info',
            ' ----------------------------------------',
            ` name             : ${data.name}`,
            ` platform         : ${data.platform}`,
            ` workflow         : ${data.workflow || ''}`,
            ` init             : ${data.init || ''}`,
            ` doc              : ${data.doc || ''}`,
            ` yyl version      : ${data.version}`,
            ' ----------------------------------------',
            ` project ${  color.yellow(data.name)  } path initial like this:`,
            ''
          ].join('\n'));
        }

        var buildPaths = [];

        if (/svn/.test(data.doc)) { // svn full path
          // {$name}/{$branches}/{$subDirs01}/{$subDirs02}/{$subDirs03}
          var parentDir = util.joinFormat(util.vars.PROJECT_PATH).split('/').pop();
          var name = parentDir == data.name? '': data.name;
          var branches = [ 'branches/commit', 'branches/develop', 'trunk' ];
          var subDirs1 = []; //pc, mobile
          var subDirs2 = ['dist', 'src'];
          var subDirs3 = ['css', 'html', 'images', 'js'];

          subDirs1.push(data.workflow);

          branches.forEach((branch) => {
            var iBranch = path.join(name, branch);

            subDirs1.forEach((subDir1) => {
              var iSubDir1 = path.join(iBranch, subDir1);

              subDirs2.forEach((subDir2) => {
                var iSubDir2;
                if (branch == 'develop') {
                  iSubDir2 = path.join(iSubDir1, subDir2);
                } else {
                  iSubDir2 = iSubDir1;
                }

                subDirs3.forEach((subDir3) => {
                  var iSubDir3 = path.join(iSubDir2, subDir3);

                  buildPaths.push(iSubDir3);
                });
              });
            });
          });

          if (!op.silent && data.confirm) {
            util.buildTree({
              path: name,
              dirList: buildPaths
            });
          }

          data.buildPaths = buildPaths;
        } else { // just project
          if (!op.silent && data.confirm) {
            util.buildTree({
              frontPath: '',
              path: path.join(util.vars.BASE_PATH, 'examples', data.workflow, data.init),
              dirFilter: /\.svn|\.git|\.sass-cache|node_modules|gulpfile\.js|package\.json|webpack\.config\.js|config\.mine\.js/,
              dirNoDeep: ['html', 'js', 'css', 'dist', 'images', 'sass', 'components']
            });
          }
        }

        var
          prompt = inquirer.createPromptModule();

        if (data.confirm) {
          prompt([{
            name: 'ok',
            message: 'is it ok?',
            type: 'confirm'
          }], (d) => {
            if (d.ok) {
              next(data);
            }
          });
        } else {
          next(data);
        }
      }).then((data) => {
        var parentDir = util.joinFormat(util.vars.PROJECT_PATH).split('/').pop();
        var frontPath = '';
        var initClientFlow = function(dirname, workflowName, initType, done) {
          log('start', 'init');
          log('msg', 'info', `init client ${workflowName} start`);
          var dirPath;

          if (~data.doc.indexOf('svn')) {
            dirPath = path.join(frontPath, 'develop', dirname);
          } else {
            dirPath = frontPath;
          }

          new util.Promise(((next) => { // mk dir front path
            log('msg', 'info', 'make dir...');
            if (dirPath && !fs.existsSync(dirPath)) {
              util.mkdirSync(dirPath);
            }

            var dirs = dirPath? fs.readdirSync(dirPath): [];
            var noEmpty = false;
            if (dirs.length) {
              dirs.forEach((str) => {
                if (!/^\./.test(str)) {
                  noEmpty = true;
                }
              });
              if (noEmpty && !op.f) {
                return done(`${dirname} directory is not empty, init fail`);
              }
            }

            if (data.buildPaths) { // 构建其他文件夹(svn)
              data.buildPaths.forEach((iPath) => {
                util.mkdirSync(iPath);
              });
            }
            log('msg', 'info', 'make dir finished');
            next();
          })).then((next) => { // copy file to PROJECT_PATH
            log('msg', 'info', `copy file to ${workflowName}`);

            var initPath = path.join(util.vars.BASE_PATH, 'examples', workflowName, initType);

            util.copyFiles(
              initPath,
              path.join(util.vars.PROJECT_PATH, dirPath),
              (err, files) => {
                if (err) {
                  return done('copy file error, init fail');
                }
                files.forEach((file) => {
                  log('msg', 'create', file);
                });
                log('msg', 'info', 'copy file finished');
                next();
              },
              (iPath) => {
                var relativePath = util.path.relative(initPath, iPath);
                if (/package\.json|gulpfile\.js|\.DS_Store|\.sass-cache|dist|webpack\.config\.js|config\.mine\.js|node_modules/.test(relativePath))  {
                  return false;
                } else {
                  return true;
                }
              },
              null,
              path.join(util.vars.PROJECT_PATH, frontPath),
              true
            );
          }).then((next) => { // copy readme
            log('msg', 'info', `copy README, .gitignore, .eslintrc, .editorconfig to ${workflowName}`);
            var iMap = {};

            iMap[path.join(util.vars.BASE_PATH, 'init-files', workflowName, 'README.md')] = path.join(util.vars.PROJECT_PATH, dirPath, 'README.md');

            var gitIgnorePath = path.join(util.vars.BASE_PATH, 'init-files', workflowName, '.gitignore');
            var npmIgnorePath = path.join(util.vars.BASE_PATH, 'init-files', workflowName, '.npmignore');

            if (fs.existsSync(gitIgnorePath)) {
              iMap[gitIgnorePath] = path.join(util.vars.PROJECT_PATH, dirPath, '.gitignore');
            } else if (fs.existsSync(npmIgnorePath)) {
              iMap[npmIgnorePath] = path.join(util.vars.PROJECT_PATH, dirPath, '.gitignore');
            }
            util.copyFiles(
              iMap,
              (err, files) => {
                if (err) {
                  return done('copy file error, init fail');
                }
                files.forEach((file) => {
                  log('msg', 'create', [file]);
                });

                log('msg', 'info', 'copy file finished');
                next();
              },
              null,
              null,
              path.join(util.vars.PROJECT_PATH, frontPath),
              true
            );
          }).then((next) => { // create dist file
            var iiPath = path.join(util.vars.PROJECT_PATH, dirPath, 'dist');
            if (!fs.existsSync(iiPath)) {
              fs.mkdirSync(iiPath);
              log('msg', 'create', iiPath);
            }
            next();
          }).then((next) => { // init configfile
            log('msg', 'info', 'init config...');
            var configPath = path.join(util.vars.PROJECT_PATH, dirPath, 'config.js');

            if (!fs.existsSync(configPath)) {
              log('msg', 'info', 'config.js not found');
              next();
              return;
            }

            var configContent = fs.readFileSync(configPath).toString();
            var replaceFn = function(str, $1, $2, $3, $4) {
              if (key == 'commonPath') {
                return $2 + util.joinFormat(path.relative(
                  path.join(util.vars.PROJECT_PATH, dirPath),
                  data[key]
                )) + $4;
              } else {
                return $2 + data[key] + $4;
              }
            };

              // 替换 commonPath
            for (var key in data) {
              configContent = configContent.replace(
                new RegExp(`(/\\*\\+${ key  }\\*/)(['"])(.*)(['"])(/\\*\\-${ key  }\\*/)`, 'g'),
                replaceFn
              );
            }

            fs.writeFileSync(configPath, configContent);
            log('msg', 'create', configPath);
            log('msg', 'info', 'init config finished');
            next();
          }).then(() => {
            log('msg', 'info', `init client ${workflowName} finished`);
            done(null, path.join(util.vars.PROJECT_PATH, dirPath));
          }).start();
        };

        if (parentDir !== data.name) { // 如项目名称与父级名称不一致, 创建顶级目录
          if (!fs.existsSync(data.name)) {
            fs.mkdirSync(data.name);
          }
          frontPath = data.name;
        }

        var padding = 0;
        var iPaths = [];
        var paddingCheck = function(err, currentPath) {
          if (err) {
            log('msg', 'error', err);
          } else {
            if (currentPath) {
              iPaths.push(currentPath);
            }
          }
          padding--;

          if (!padding) {
            log('finish', 'init', `${data.name} init complete`);

            if (iPaths.length && !op.silent) {
              util.runNodeModule('yyl', {
                cwd: __dirname
              });
              util.openPath(iPaths[0]);
            }

            if (global.YYL_RUN_CALLBACK) {
              setTimeout(global.YYL_RUN_CALLBACK, 0);
            }
          }
        };

        if (data.workflow) {
          padding += 2;
          initClientFlow( data.platform, data.workflow, data.init, paddingCheck);
          if (!op.nonpm) {
            wServer.init(data.workflow, paddingCheck);
          } else {
            paddingCheck();
          }
        }
      }).start();
    }
  };

module.exports = function() {
  var iArgv = util.makeArray(arguments);
  var op = util.envParse(iArgv.slice(1));

  if (op.h || op.help) {
    events.help();
  } else {
    events.init(op);
  }
};
