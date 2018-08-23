'use strict';
const util = require('./w-util.js');
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
      // + w-jade2pug
      'jade2pug': {
        name: 'JTOP',
        color: 'white',
        bgColor: 'bgBlue'
      },
      // - w-jade2pug
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
      }
      // - w-update
    }
  }
});

const fn = {
  matchKey(str, word, r) {
    return str
      .replace(new RegExp(` ${word}$`, 'g'), ` ${r}`)
      .replace(new RegExp(`^${word} `, 'g'), `${r} `)
      .replace(new RegExp(` ${word} `, 'g'), ` ${r} `)
      .replace(new RegExp(` ${word}([:,.]+)`, 'g'), ` ${r}$1`);
  },
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

    case 'finish':
      if (cache.currentType) {
        cost = new Date() - cache.timer[cache.currentType];
        argv.push(`[${cache.currentType}] task finished, cost ${fn.costFormat(cost)}`);
        util.msg.success.apply(util.msg, argv);
      }
      break;

    case 'cmd':
      if (!argv.length) {
        argv = [type];
      }
      util.msg.cmd.apply(util.msg, argv);
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
          util.msg[type](`${chalk.cyan(argv[0])} <= [${chalk.yellow(argv.slice(1).join(','))}]`);
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

  if (!iStatus && module != 'clear' && module != 'cmd') {
    return log4Detail(module, type, argv);
  }

  const prinitInfo = () => {
    if (cache.isEnd) {
      return;
    }
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
      if (!cache.isEnd) {
        util.infoBar.end();
      }
      cache.isEnd = false;
      clearInterval(cache.timeIntervalKey);
      cache.timeIntervalKey = setInterval(() => {
        prinitInfo();
      }, 1000);
      prinitInfo();
      break;

    case 'clear':
      cache.isEnd = true;
      util.cleanScreen();
      break;

    case 'cmd':
      cache.isEnd = true;
      if (!argv.length) {
        argv = [type];
      }
      util.infoBar.print('cmd', {
        barLeft: chalk.cyan(argv.join(' ')),
        foot: util.getTime()
      }).end();
      break;

    case 'finish':
      cache.isEnd = true;
      util.infoBar.end();
      clearInterval(cache.timeIntervalKey);
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
        });
        util.infoBar.print('success', {
          barLeft: iStatus.success.concat(iStatus.rev).map((a) => a.join(' '))
        });
      }

      util.infoBar.print('warn', {
        barLeft: iStatus.warns.map((a) => a.join(' '))
      }).end();

      delete cache.status[cache.currentType];
      cache.currentType = null;
      break;

    case 'end':
      cache.isEnd = true;
      util.infoBar.end();
      break;

    case 'msg':
      argv = argv.map((ctx) => {
        let r = ctx;
        if (typeof ctx == 'string') {
          r = fn.matchKey(r, 'finished', chalk.green('finished'));
          r = fn.matchKey(r, 'failed', chalk.red('failed'));
          r = fn.matchKey(r, 'error', chalk.red('error'));
        }
        return r;
      });
      switch (type) {
        case 'create':
          cache.isEnd = false;
          iStatus.adds.push(argv);
          break;

        case 'update':
          cache.isEnd = false;
          iStatus.updates.push(argv);
          break;

        case 'del':
          cache.isEnd = false;
          iStatus.dels.push(argv);
          break;

        case 'success':
          iStatus.success.push(argv);
          break;

        case 'error':
          cache.isEnd = false;
          iStatus.errors.push(argv);
          break;

        case 'warn':
          cache.isEnd = false;
          iStatus.warns.push(argv);
          break;

        case 'rev':
          iStatus.success.push(['rev:'].concat(argv));
          break;

        case 'optimize':
          cache.isEnd = false;
          iStatus.optimizes.push(argv);
          break;

        case 'concat':
          argv = argv.map((src) => {
            return util.path.relative(util.vars.PROJECT_PATH, src);
          });
          iStatus.success.push([`concat: ${chalk.cyan(argv[0])}`]);
          iStatus.success.push([`<= [${chalk.yellow(argv.slice(1).join(','))}]`]);
          break;

        default:
          break;
      }
      prinitInfo();
      break;
  }
};

const log4Silent = (module, type, argv) => {
  switch (module) {
    case 'msg':
      switch (type) {
        case 'warn':
        case 'error':
          util.msg[type].apply(util.msg, argv);
          break;
      }
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
  switch (cache.logLevel) {
    case 0:
      return log4Silent(module, type, iArgv);
    case 1:
      return log4Base(module, type, iArgv);
    case 2:
      return log4Detail(module, type, iArgv);
  }
};
log.update = (lv) => {
  cache.logLevel = lv;
};

log.setLevel

module.exports = log;
