'use strict';
const util = require('yyl-util');
const print = require('yyl-print');
const chalk = require('chalk');

const cache = {
  logLevel: -1
};

print.log.init({
  type: {
    // + status
    'info': {
      name: 'INFO',
      color: chalk.black.bgWhite
    },
    'done': {
      name: 'DONE',
      color: chalk.black.bgGreen
    },
    'warn': {
      name: 'WARN',
      color: chalk.white.bgYellow
    },
    'success': {
      name: 'PASS',
      color: chalk.white.bgCyan
    },
    'create': {
      name: 'ADD>',
      color: chalk.white.bgGreen
    },
    'update': {
      name: 'UPDT',
      color: chalk.white.bgMagenta
    },
    'del': {
      name: 'DEL>',
      color: chalk.white.bgRed
    },
    // - status
    // + task name
    'init': {
      name: 'INIT',
      color: chalk.white.bgBlue.bold
    },

    'server': {
      name: 'SERV',
      color: chalk.white.bgBlue.bold
    },
    'watch': {
      name: 'WATC',
      color: chalk.white.bgBlue.bold
    },
    'optimize': {
      name: 'OPTI',
      color: chalk.white.bgRed.bold
    },
    'proxy': {
      name: 'PROX',
      color: chalk.white.bgBlack.bold
    },
    'commit-copy': {
      name: 'COPY',
      color: chalk.white.bgBlue.bold
    },
    'commit-step01': {
      name: 'ST01',
      color: chalk.white.bgBlue.bold
    },
    'commit-step02': {
      name: 'ST02',
      color: chalk.white.bgBlue.bold
    },
    'commit-step03': {
      name: 'ST03',
      color: chalk.white.bgBlue.bold
    },
    'make': {
      name: 'MAKE',
      color: chalk.white.bgBlue.bold
    },
    'remove': {
      name: 'RM',
      color: chalk.white.bgBlue.bold
    },
    'cmd': {
      name: 'CMD>',
      color: chalk.white.bgBlack.bold
    },
    'yyl': {
      name: 'YYL>',
      color: chalk.white.bgBlack.bold
    }
    // - w-update
  }
});

const log = (module, type, argv) => {
  let iArgv = [];
  if (argv) {
    iArgv = util.type(argv) !== 'array' ? [argv] : argv;
  }
  if (!~cache.logLevel) {
    cache.logLevel = 1;
  }

  print.log.setLogLevel(+cache.logLevel);

  switch (module) {
    case 'start':
      if (type in print.log[type]) {
        print.log[type](...iArgv);
      }
      break;
    case 'clear':
      if (cache.logLevel) {
        print.cleanScreen();
      }
      break;

    case 'cmd':
      print.log.cmd(...iArgv);
      break;

    case 'yyl':
      print.log.yyl(...iArgv);
      break;

    case 'finished':
    case 'finish':
    case 'end':
      break;

    case 'msg':
      if (type in print.log) {
        print.log[type](...iArgv);
      } else {
        print.log.info(...iArgv);
      }
      break;

    default:
      break;
  }
};
log.update = (lv) => {
  cache.logLevel = lv;
};

module.exports = log;

