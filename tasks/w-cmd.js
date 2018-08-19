'use strict';
const util = require('./w-util.js');
const chalk = require('chalk');
const path = require('path');

const version = require('./w-version.js');
const init = require('./w-init.js');
const optimize = require('./w-optimize.js');
const server = require('./w-server.js');
const commit = require('./w-commit.js');
const remove = require('./w-remove');
const supercall = require('./w-supercall.js');
const update = require('./w-update.js');
const make = require('./w-make.js');
const info = require('./w-info.js');
const jade2pug = require('./w-jade2pug.js');
const test = require('./w-test.js');

const opzerHandles = optimize.getHandles(path.join(util.vars.PROJECT_PATH, 'config.js'));

// // 获取当前目录可操作的 optimize 句柄
// const configPath = path.join(util.vars.PROJECT_PATH, 'config.js');
// let curSeed = null;
// const opzerHandles = [];
// if (fs.existsSync(configPath)) {
//   try {
//     const config = require(configPath)
//   } catch (er) {}
//   if (config && config.workflow) {
//     curSeed = SEED[config.workflow];

//     if (curSeed) {
//       const opzer =

//     }
//   }
// }

const events = {
  version,
  init,
  optimize,
  server,
  test,
  commit,
  remove,
  supercall,
  update,
  make,
  info,
  jade2pug,
  help: function(iEnv) {
    const h = {
      usage: 'yyl',
      commands: {
        'init': 'init commands',
        'info': 'information',
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

    opzerHandles.forEach((key) => {
      h.commands[key] = 'optimize';
    });
    if (!iEnv || !iEnv.silent) {
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

  if (!isNaN(iEnv.logLevel) && iEnv.logLevel !== true) {
    events.server.setLogLevel(iEnv.logLevel, true, true);
  }

  const makePromise = function (handle, argv) {
    if (!iEnv.nocatch) {
      return handle(...argv).catch((er) => {
        console.log(er);
      });
    } else {
      return handle(...argv).catch(() => {});
    }
  };

  let configPath;
  if (iEnv.config) {
    configPath = util.path.resolve(util.vars.PROJECT_PATH, iEnv.config);
  } else {
    configPath = util.path.resolve(util.vars.PROJECT_PATH, 'config.js');
  }

  // optimize
  if (~opzerHandles.indexOf(ctx)) {
    return makePromise(events.optimize, [ctx, iEnv, configPath]);
  }

  switch (ctx) {
    case '-v':
    case '--version':
      return makePromise(events.version, [iEnv]);

    case '--logLevel':
      if (iArgv[1]) {
        return makePromise(events.server.setLogLevel, [iArgv[1]]);
      } else {
        return makePromise(events.server.getLogLevel, []);
      }

    case '-h':
    case '--help':
      return makePromise(events.help, [iEnv]);

    case '--path':
    case '-p':
      return makePromise(events.path, [iEnv]);

    case 'init':
      return makePromise(events.init, [iEnv]);

    case 'server':
      return makePromise(events.server.run, [iArgv]);

    case 'commit':
      return makePromise(events.commit.run, [iEnv]);

    case 'examples':
    case 'example':
      return makePromise(events.examples, [iEnv]);

    case 'rm':
      return makePromise(events.remove, [iArgv[1]]);

    case 'test':
      return makePromise(events.test, []);

    case 'supercall':
      return makePromise(events.supercall.run, [iArgv]);

    case 'update':
      return makePromise(events.update.run, [iArgv.slice(1)]);

    case 'make':
      return makePromise(events.make.run, [iArgv.slice(1)]);

    case 'jade2pug':
      return makePromise(events.jade2pug.run, [iEnv]);

    case 'info':
      return makePromise(events.info.run, [iEnv]);

    default:
      return makePromise(events.help, []);
  }
};
