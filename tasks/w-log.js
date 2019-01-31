'use strict';
const util = require('yyl-util');
const print = require('yyl-print');
const chalk = require('chalk');

const cache = {
  timer: {},
  currentType: null,
  logLevel: -1,
  isEnd: false,
  timeIntervalKey: 0,
  status: {
    // 'name': {
    //   'error': [],
    //   'warn': [],
    //   'create': []
    // }
  }
};

print.log.init({
  type: {
    'help': {
      name: 'HELP',
      color: 'white',
      bgColor: 'bgBlue'
    },
    'info': {
      name: 'INFO',
      color: 'white',
      bgColor: 'bgBlue'
    },
    'init': {
      name: 'INIT',
      color: 'white',
      bgColor: 'bgBlue'
    },

    'server': {
      name: 'SERV',
      color: 'white',
      bgColor: 'bgBlue'
    },
    'watch': {
      name: 'WATC',
      color: 'white',
      bgColor: 'bgBlue'
    },
    'optimize': {
      name: 'OPTI',
      color: 'white',
      bgColor: 'bgRed'
    },
    'rebuild': {
      name: 'REBU',
      color: 'white',
      bgColor: 'bgBlue'
    },
    'proxy': {
      name: 'PROX',
      color: 'white',
      bgColor: 'bgBlack'
    },
    'proxy2': {
      name: 'PROX',
      color: 'black',
      bgColor: 'bgWhite'
    },
    'done': {
      name: 'DONE',
      color: 'black',
      bgColor: 'bgGreen'
    },
    'warn': {
      name: 'WARN',
      color: 'white',
      bgColor: 'bgYellow'
    },
    'success': {
      name: 'PASS',
      color: 'white',
      bgColor: 'bgCyan'
    },
    // + w-commit
    'commit-copy': {
      name: 'COPY',
      color: 'white',
      bgColor: 'bgBlue'
    },
    'commit-step01': {
      name: 'ST01',
      color: 'white',
      bgColor: 'bgBlue'
    },
    'commit-step02': {
      name: 'ST02',
      color: 'white',
      bgColor: 'bgBlue'
    },
    'commit-step03': {
      name: 'ST03',
      color: 'white',
      bgColor: 'bgBlue'
    },
    // - w-commit
    // + make
    'make': {
      name: 'MAKE',
      color: 'white',
      bgColor: 'bgBlue'
    },
    // - make
    // + w-remove
    'remove': {
      name: 'RM',
      color: 'white',
      bgColor: 'bgBlue'
    },
    // - w-remove
    // + w-update
    'update': {
      name: 'UPDT',
      color: 'white',
      bgColor: 'bgBlue'
    },
    'cmd': {
      name: 'CMD>',
      color: 'white',
      bgColor: 'bgBlack'
    },
    'yyl': {
      name: 'YYL>',
      color: 'white',
      bgColor: 'bgBlack'
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
      print.cleanScreen();
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
