'use strict';
const util = require('./w-util.js');
const chalk = require('chalk');



var
  events = {
    version: require('./w-version'),
    init: require('./w-init'),
    optimize: require('./w-optimize'),
    server: require('./w-server'),
    test: require('./w-test'),
    commit: require('./w-commit'),
    remove: require('./w-remove'),
    supercall: require('./w-supercall'),
    update: require('./w-update'),
    make: require('./w-make'),
    info: require('./w-info'),
    jade2pug: require('./w-jade2pug'),
    help: function() {
      const iEnv = util.envPrase(arguments);
      const h = {
        usage: 'yyl',
        commands: {
          'init': 'init commands',
          'info': 'information',
          'watch': 'watch task',
          'all': 'optimize task',
          'server': 'local server commands',
          'examples': 'show yyl examples',
          'commit': 'commit code to svn/git server(need config)',
          'update': 'update yyl from npm',
          'make': 'make new component',
          'jade2pug': 'transform *.jade to *.pug'
        },
        options: {
          '-h, --help': 'print usage information',
          '-v, --version': 'print yyl version',
          '-p, --path': 'show the yyl command local path',
          '--logLevel': 'log level',
          '--config': 'change the config file to the setting'
        }
      };
      if (!iEnv.silent) {
        util.help(h);
      }
      return Promise.resolve(h);
    },
    path: function() {
      const iEnv = util.envPrase(arguments);
      if (!iEnv.silent) {
        console.log([
          '',
          'yyl command path:',
          chalk.yellow(util.vars.BASE_PATH),
          ''
        ].join('\n'));
        util.openPath(util.vars.BASE_PATH);
      }
      return Promise.resolve(util.vars.BASE_PATH);
    },
    examples: function() {
      const iEnv = util.envParse(arguments);
      var iPath = util.joinFormat(util.vars.BASE_PATH, 'examples');
      if (!iEnv.silent) {
        console.log([
          '',
          'yyl examples:',
          chalk.yellow(iPath),
          ''
        ].join('\n'));
        util.openPath(iPath);
      }

      return Promise.resolve(iPath);
    }
  };


module.exports = function(ctx) {
  var iArgv = util.makeArray(arguments);
  var iEnv = util.envPrase(arguments);

  var iVer = process.versions.node;
  if (iVer.localeCompare('4.0.0') < 0) {
    return util.msg.error('please makesure your node >= 4.0.0');
  }

  if (!isNaN(iEnv.logLevel)) {
    events.server.setLogLevel(iEnv.logLevel, true);
  }

  let r;
  switch (ctx) {
    case '-v':
    case '--version':
      r = events.version.apply(events, iArgv.slice(1));
      break;

    case '--logLevel':
      if (iArgv[1]) {
        r = events.server.setLogLevel(iArgv[1]);
      } else {
        r = events.server.getLogLevel();
      }
      break;


    case '-h':
    case '--help':
      r = events.help.apply(events, iArgv.slice(1));
      break;

    case '--path':
    case '-p':
      r = events.path.apply(events, iArgv.slice(1));
      break;

    case 'init':
      r = events.init.apply(events, iArgv);
      break;


    case 'html':
    case 'js':
    case 'css':
    case 'images':
    case 'watch':
    case 'watchAll':
    case 'all':
    case 'connect':
    case 'concat':
    case 'rev':
    case 'resource':
      r = events.optimize.apply(events, iArgv);
      break;

    case 'server':
      r = events.server.run.apply(events.server, iArgv);
      break;

    case 'commit':
      r = events.commit.run.apply(events.commit, iArgv);
      break;

    case 'examples':
    case 'example':
      r = events.examples.apply(events.examples, iArgv.slice(1));
      break;

    case 'rm':
      r = events.remove.apply(events, iArgv.slice(1));
      break;

    case 'test':
      r = events.test();
      break;

    case 'supercall':
      r = events.supercall.run.apply(events.supercall, iArgv);
      break;

    case 'update':
      r = events.update.run.apply(events.update, iArgv.slice(1));
      break;

    case 'make':
      r = events.make.run.apply(events, iArgv.slice(1));
      break;

    case 'jade2pug':
      r = events.jade2pug.run.apply(events, iArgv);
      break;

    case 'info':
      r = events.info.run.apply(events, iArgv.slice(1));
      break;

    default:
      r = events.help();
      break;
  }

  if (!iEnv.nocatch) {
    r.catch(() => {});
  }
  return r;
};
