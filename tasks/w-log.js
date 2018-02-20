'use strict';
const util = require('./w-util.js');
const chalk = require('chalk');

const cache = {
  timer: {},
  currentType: null,
  logLevel: -1,
  status: {
    // 'name': {
    //   'error': [],
    //   'warn': [],
    //   'create': []
    // }
  }
};

util.infoBar.init({
  head: {
    key: {
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
        bgColor: 'bgRed'
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
        bgColor: 'bgBlue'
      }
    }
  }
});

const fn = {
  costFormat(cost) {
    let min;
    let sec;
    let us;
    if (cost < 1000) {
      return `${cost} ms`;
    } else if (cost < 1000 * 60) {
      sec = Math.floor(cost / 1000);
      us = cost % 1000;
      return `${sec} s ${us} ms`;
    } else {
      min = Math.floor(cost / 1000 / 60);
      sec = Math.floor(cost / 1000) % 60;
      us = cost % 1000;
      return `${min} min ${sec} s ${us} ms`;
    }
  }
};

const log4Detail = (module, type, argv) => {
  let cost;
  switch (module) {
    case 'start':
      cache.timer[type] = new Date();
      cache.currentType = type;
      util.msg.info(`[${type}] task start`);
      break;

    case 'clear':
    case 'clean':
      util.cleanScreen();
      break;

    case 'finish':
      cost = new Date() - cache.timer[cache.currentType];
      argv.push(`[${cache.currentType}] task finished, cost ${fn.costFormat(cost)}`);
      util.msg.success.apply(util.msg, argv);
      break;


    case 'msg':
      if (!util.msg[type]) {
        type = 'info';
      }
      switch (type) {
        case 'optimize':
        case 'create':
        case 'del':
        case 'update':
          util.msg[type](util.path.relative(util.vars.PROJECT_PATH, argv[0]));
          break;

        case 'concat':
          argv = argv.map((src) => {
            return util.path.relative(util.vars.PROJECT_PATH, src);
          });
          util.msg[type](`${argv[0]} <= [${argv.slice(1).join(',')}]`);
          break;

        default:
          util.msg[type].apply(util.msg, argv);
          break;
      }
      break;
  }
};

const log4Base = (module, type, argv) => {
  let iStatus;
  let cost;

  if (module == 'start') {
    cache.timer[type] = new Date();
    cache.currentType = type;
    iStatus = cache.status[cache.currentType] = {
      errors: [],
      warns: [],
      adds: [],
      success: [],
      updates: [],
      dels: [],
      rev: [],
      optimizes: [],
      defaultText: argv.join(' ')
    };
  } else {
    iStatus = cache.status[cache.currentType];
  }

  if (module == 'finish' && type) {
    argv = [type].concat(argv);
  }

  if (!iStatus) {
    return log4Detail(module, type, argv);
  }

  const prinitInfo = () => {
    let leftArr = [];
    let rightArr = [];
    if (iStatus.optimizes.length) {
      leftArr.push(`${chalk.red('OPTIMIZE')} ${chalk.yellow(iStatus.optimizes.length)}`);
    }

    if (iStatus.adds.length) {
      leftArr.push(`${chalk.green('ADD')} ${chalk.yellow(iStatus.adds.length)}`);
    }

    if (iStatus.updates.length) {
      leftArr.push(`${chalk.cyan('UPDATE')} ${chalk.yellow(iStatus.updates.length)}`);
    }

    if (iStatus.dels.length) {
      leftArr.push(`${chalk.gray('DEL')} ${chalk.yellow(iStatus.dels.length)}`);
    }

    if (iStatus.errors.length) {
      rightArr.push(chalk.red(`${iStatus.errors.length} errors`));
    }

    if (iStatus.warns.length) {
      rightArr.push(chalk.yellow(`${iStatus.warns.length} warning`));
    }

    util.infoBar.print(cache.currentType, {
      foot: util.getTime(),
      barLeft: leftArr.join(' ') || iStatus.defaultText,
      barRight: rightArr.join(' ')
    });
  };

  switch (module) {
    case 'start':
      util.infoBar.end();
      prinitInfo();
      break;

    case 'clear':
    case 'clean':
      util.cleanScreen();
      break;

    case 'finish':
      util.infoBar.end();
      cost = new Date() - cache.timer[cache.currentType];
      if (iStatus.errors.length) {
        util.infoBar.print('error', {
          barRight: `cost ${fn.costFormat(cost)}`,
          foot: util.getTime()
        }).end();
        iStatus.errors.forEach((argv) => {
          console.error.apply(console, argv);
        });
      } else {
        util.infoBar.print('done', {
          barLeft: argv.join(' '),
          barRight: `cost ${fn.costFormat(cost)}`
        }).end();
        util.infoBar.print('success', {
          barLeft: iStatus.success.concat(iStatus.rev).map((a) => a.join(' '))
        }).end();
      }

      util.infoBar.print('warn', {
        barLeft: iStatus.warns.map((a) => a.join(' '))
      }).end();

      delete cache.status[cache.currentType];
      cache.currentType = null;
      break;

    case 'end':
      util.infoBar.end();
      break;

    case 'msg':
      switch (type) {
        case 'create':
          iStatus.adds.push(argv);
          break;

        case 'update':
          iStatus.updates.push(argv);
          break;

        case 'del':
          iStatus.dels.push(argv);
          break;

        case 'success':
          iStatus.success.push(argv);
          break;

        case 'error':
          iStatus.errors.push(argv);
          break;

        case 'warn':
          iStatus.warns.push(argv);
          break;

        case 'rev':
          iStatus.success.push(['rev:'].concat(argv));
          break;

        case 'optimize':
          iStatus.optimizes.push(argv);
          break;

        case 'concat':
          argv = argv.map((src) => {
            return util.path.relative(util.vars.PROJECT_PATH, src);
          });
          iStatus.success.push([`concat: ${argv[0]}`]);
          iStatus.success.push([`<= [${argv.slice(1).join(',')}]`]);
          break;

        default:
          break;
      }
      prinitInfo();
      break;
  }
};

const log = (module, type, argv) => {
  let iArgv = [];
  if (argv) {
    iArgv = util.type(argv) !== 'array' ? [argv] : argv;
  }
  if (!~cache.logLevel) {
    cache.logLevel = 1;
  }
  return cache.logLevel < 2 ?
    log4Base(module, type, iArgv) :
    log4Detail(module, type, iArgv);
};
log.update = (lv) => {
  cache.logLevel = lv;
};

module.exports = log;
