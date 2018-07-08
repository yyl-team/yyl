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
    help: function(iEnv) {
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
    path: function(iEnv) {
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
    examples: function(iEnv) {
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
  const iArgv = util.makeArray(arguments);
  const iEnv = util.envPrase(arguments);

  var iVer = process.versions.node;
  if (iVer.localeCompare('4.0.0') < 0) {
    return util.msg.error('please makesure your node >= 4.0.0');
  }

  if (!isNaN(iEnv.logLevel) && iEnv.logLevel !== true) {
    events.server.setLogLevel(iEnv.logLevel, true, true);
  }

  const makePromise = function (handle, argv) {
    if (!iEnv.nocatch) {
      return handle(argv).catch((er) => {
        console.log(er);
      });
    } else {
      return handle(argv).catch(() => {});
    }
  };

  switch (ctx) {
    case '-v':
    case '--version':
      return makePromise(events.version, iEnv);

    case '--logLevel':
      if (iArgv[1]) {
        return makePromise(events.server.setLogLevel, iArgv[1]);
      } else {
        return makePromise(events.server.getLogLevel);
      }

    case '-h':
    case '--help':
      return makePromise(events.help, iEnv);

    case '--path':
    case '-p':
      return makePromise(events.path, iEnv);

    case 'init':
      return makePromise(events.init, iEnv);

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
    case 'tpl':
      return makePromise(events.optimize, iArgv);

    case 'server':
      return makePromise(events.server.run, iArgv);

    case 'commit':
      return makePromise(events.commit.run, iEnv);

    case 'examples':
    case 'example':
      return makePromise(events.examples, iEnv);

    case 'rm':
      return makePromise(events.remove, iArgv[1]);

    case 'test':
      return makePromise(events.test);

    case 'supercall':
      return makePromise(events.supercall.run, iArgv);

    case 'update':
      return makePromise(events.update.run, iArgv.slice(1));

    case 'make':
      return makePromise(events.make.run, iArgv.slice(1));

    case 'jade2pug':
      return makePromise(events.jade2pug.run, iEnv);

    case 'info':
      return makePromise(events.info.run, iEnv);

    default:
      return makePromise(events.help);
  }
};
