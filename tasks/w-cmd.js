'use strict';
const chalk = require('chalk');
const path = require('path');
const util = require('./w-util.js');
const SEED = require('./w-seed.js');




const events = {
  help(iEnv, opzerHandles) {
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


module.exports = async function(ctx) {
  const iArgv = util.makeArray(arguments);
  const iEnv = util.envPrase(arguments);

  const PROJECT_CONFIG_PATH = path.join(util.vars.PROJECT_PATH, 'config.js');
  const opzerHandles = SEED.getHandles(PROJECT_CONFIG_PATH) || [];

  if (!isNaN(iEnv.logLevel) && iEnv.logLevel !== true) {
    require('./w-server.js').setLogLevel(iEnv.logLevel, true, true);
  }

  let configPath;
  if (iEnv.config) {
    configPath = util.path.resolve(util.vars.PROJECT_PATH, iEnv.config);
  } else {
    configPath = util.path.resolve(util.vars.PROJECT_PATH, 'config.js');
  }

  // optimize
  let handle = null;
  let argv = [];
  if (~opzerHandles.indexOf(ctx)) {
    handle = require('./w-optimize.js');
    argv = [ctx, iEnv, configPath];
  } else if (ctx === 'make') {
    handle = require('./w-make.js');
    argv = [iArgv[1], iEnv, configPath];
  } else {
    switch (ctx) {
      case '-v':
      case '--version':
        handle = require('./w-version.js');
        argv = [iEnv];
        break;

      case '--logLevel':
        if (iArgv[1]) {
          handle = require('./w-server.js').setLogLevel;
          argv = [iArgv[1]];
        } else {
          handle = require('./w-server.js').getLogLevel;
          argv = [];
        }
        break;

      case '-h':
      case '--help':
        handle = events.help;
        argv = [iEnv, opzerHandles];
        break;

      case '--path':
      case '-p':
        handle = events.path;
        argv = [iEnv];
        break;

      case 'init':
        handle = require('./w-init.js');
        argv = [iEnv];
        break;

      case 'server':
        handle = require('./w-server.js');
        argv = [iArgv[1], iEnv, configPath];
        break;

      case 'commit':
        handle = require('./w-commit.js').run;
        argv = [iEnv, configPath];
        break;

      case 'rm':
        handle = require('./w-remove.js');
        argv = [iArgv[1]];
        break;

      case 'test':
        handle = require('./w-test.js');
        argv = [];
        break;

      case 'profile':
        handle = require('./w-profile.js').print;
        argv = [];
        break;

      case 'make':
        handle = require('./w-make.js').run;
        argv = [iArgv.slice(1)];
        break;

      case 'info':
        handle = require('./w-info.js').run;
        argv = [iEnv];
        break;

      default:
        handle = events.help;
        argv = [iEnv, opzerHandles];
        break;
    }
  }

  return await handle(...argv);
};
