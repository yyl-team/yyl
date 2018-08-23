'use strict';
const chalk = require('chalk');
const path = require('path');
const util = require('./w-util.js');
const SEED = require('./w-seed.js');

const PROJECT_CONFIG_PATH = path.join(util.vars.PROJECT_PATH, 'config.js');
const opzerHandles = SEED.getHandles(PROJECT_CONFIG_PATH) || [];

const events = {
  help(iEnv) {
    const h = {
      usage: 'yyl',
      commands: {
        'init': 'init commands',
        'info': 'information',
        'server': 'local server commands',
        'examples': 'show yyl examples',
        'commit': 'commit code to svn/git server(need config)',
        'make': 'make new component'
      },
      options: {
        '-h, --help': 'print usage information',
        '-v, --version': 'print yyl version',
        '-p, --path': 'show the yyl command local path',
        '--logLevel': 'log level',
        '--config': 'change the config file to the setting'
      }
    };
    opzerHandles.forEach((key) => {
      h.commands[key] = 'optimize';
    });
    if (!iEnv || !iEnv.silent) {
      util.help(h);
    }
    return Promise.resolve(h);
  },
  path(iEnv) {
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
  }
};


module.exports = function(ctx) {
  const iArgv = util.makeArray(arguments);
  const iEnv = util.envPrase(arguments);

  if (!isNaN(iEnv.logLevel) && iEnv.logLevel !== true) {
    events.server.setLogLevel(iEnv.logLevel, true, true);
  }

  const makePromise = function (handle, argv) {
    return handle(...argv).catch(() => {});
  };

  let configPath;
  if (iEnv.config) {
    configPath = util.path.resolve(util.vars.PROJECT_PATH, iEnv.config);
  } else {
    configPath = util.path.resolve(util.vars.PROJECT_PATH, 'config.js');
  }

  // optimize
  if (~opzerHandles.indexOf(ctx)) {
    return makePromise(require('./w-optimize.js'), [ctx, iEnv, configPath]);
  }

  switch (ctx) {
    case '-v':
    case '--version':
      return makePromise(require('./w-version.js'), [iEnv]);

    case '--logLevel':
      if (iArgv[1]) {
        return makePromise(require('./w-server.js').setLogLevel, [iArgv[1]]);
      } else {
        return makePromise(require('./w-server.js').getLogLevel, []);
      }

    case '-h':
    case '--help':
      return makePromise(events.help, [iEnv]);

    case '--path':
    case '-p':
      return makePromise(events.path, [iEnv]);

    case 'init':
      return makePromise(require('./w-init.js'), [iEnv]);

    case 'server':
      return makePromise(require('./w-server.js'), [iArgv[1], iEnv, configPath]);

    case 'commit':
      return makePromise(require('./w-commit.js').run, [iEnv, configPath]);

    case 'rm':
      return makePromise(require('./w-remove.js'), [iArgv[1]]);

    case 'test':
      return makePromise(require('./w-test.js'), []);

    case 'profile':
      return makePromise(require('./w-profile.js').print, []);

    case 'make':
      return makePromise(require('./w-make.js').run, [iArgv.slice(1)]);

    case 'info':
      return makePromise(require('./w-info.js').run, [iEnv]);

    default:
      return makePromise(events.help, []);
  }
};
