'use strict';
const chalk = require('chalk');
const fs = require('fs');
const print = require('yyl-print');
const util = require('yyl-util');
const extOs = require('yyl-os');

const SEED = require('./w-seed.js');
const vars = require('../lib/vars.js');
const log = require('../lib/log.js');
const pkg = require('../package.json');

const events = {
  help(iEnv, opzerHandles) {
    const h = {
      usage: 'yyl',
      commands: {
        'init': 'init commands',
        'info': 'information',
        'server': 'local server commands',
        'proxy': 'proxy server commands',
        'commit': 'commit code to svn/git server(need config)',
        'make': 'make new component'
      },
      options: {
        '--help': 'print usage information',
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
      print.help(h);
    }
    return Promise.resolve(h);
  },
  path(iEnv) {
    if (!iEnv.silent) {
      log('msg', 'success', `path: ${chalk.yellow.bold(vars.BASE_PATH)}`);
      extOs.openPath(vars.BASE_PATH);
    }
    return Promise.resolve(vars.BASE_PATH);
  }
};

module.exports = async function(ctx) {
  const iArgv = util.makeArray(arguments);
  const iEnv = util.envParse(arguments);
  let type = '';


  let configPath;
  if (iEnv.config) {
    configPath = util.path.resolve(vars.PROJECT_PATH, iEnv.config);
  } else {
    configPath = util.path.resolve(vars.PROJECT_PATH, 'yyl.config.js');
    if (!fs.existsSync(configPath)) {
      configPath = util.path.resolve(vars.PROJECT_PATH, 'config.js');
    }
  }

  const opzerHandles = SEED.getHandles(configPath) || [];

  if (!isNaN(iEnv.logLevel) && iEnv.logLevel !== true) {
    require('./w-server.js').setLogLevel(iEnv.logLevel, true, true);
  }



  // optimize
  let handle = null;
  let argv = [];
  if (~opzerHandles.indexOf(ctx)) {
    handle = require('./w-optimize.js');
    argv = [ctx, iEnv, configPath];
    type = 'optimize';
  } else if (ctx === 'make') {
    handle = require('./w-make.js');
    argv = [iArgv[1], iEnv, configPath];
    type = '';
  } else {
    switch (ctx) {
      case '-v':
      case '--version':
        handle = require('./w-version.js');
        argv = [iEnv];
        type = '';
        break;

      case '--logLevel':
        if (iArgv[1]) {
          handle = require('./w-server.js').setLogLevel;
          argv = [iArgv[1]];
        } else {
          handle = require('./w-server.js').getLogLevel;
          argv = [];
        }
        type = 'info';
        break;

      case '-h':
      case '--help':
        handle = events.help;
        argv = [iEnv, opzerHandles];
        type = '';
        break;

      case '--path':
      case '-p':
        handle = events.path;
        argv = [iEnv];
        type = 'info';
        break;

      case 'init':
        handle = require('./w-init.js');
        if (iEnv.help) {
          handle = handle.help;
        }

        type = 'init';
        argv = [iEnv];
        break;

      case 'server':
        handle = require('./w-server.js');
        argv = [iArgv[1], iEnv, configPath];
        type = 'server';
        if (iEnv.help) {
          handle = handle.help;
          argv = [iEnv];
          type = '';
        }
        break;

      case 'proxy':
        handle = require('./w-proxy.js');
        argv = [iArgv[1], iEnv, configPath];
        type = 'proxy';
        if (iEnv.help) {
          handle = handle.help;
          argv = [ iEnv ];
          type = '';
        }
        break;

      case 'commit':
        if (iEnv.help) {
          handle = require('./w-commit.js').help;
          type = '';
        } else {
          handle = require('./w-commit.js').run;
          type = 'info';
        }
        argv = [iEnv, configPath];

        break;

      case 'rm':
        handle = require('./w-remove.js');
        argv = [iArgv[1]];
        type = 'remove';
        break;

      case 'test':
        handle = require('./w-test.js');
        argv = [];
        type = 'info';
        break;

      case 'profile':
        handle = require('./w-profile.js').print;
        argv = [];
        type = 'info';
        break;

      case 'make':
        handle = require('./w-make.js').run;
        argv = [iArgv.slice(1)];
        type = 'make';
        break;

      case 'info':
        handle = require('./w-info.js').run;
        argv = [iEnv, configPath];
        type = 'info';
        break;

      default:
        handle = events.help;
        argv = [iEnv, opzerHandles];
        type = '';
        break;
    }
  }
  if (type) {
    log('clear');
    log('msg', 'yyl', `${chalk.yellow.bold(pkg.version)}`);
    log('msg', 'cmd', `yyl ${iArgv.join(' ')}`);
    log('start', type, `${type} task starting...`);
  }

  let r;

  try {
    r = await handle(...argv);
    if (type) {
      log('msg', 'finished');
    }
  } catch (er) {
    log('msg', 'error', er);
    log('msg', 'finished');
  }



  return r;
};
