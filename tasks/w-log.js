'use strict';
const util = require('./w-util.js');

const cache = {
  timer: {},
  currentType: null,
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
      'done': {
        name: 'DONE',
        color: 'black',
        bgColor: 'bgGreen'
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
  },
  numFormat(num) {
    const numStr = `${num}`;
    if (numStr.length < 2) {
      return `0${num}`;
    } else {
      return `${num}`;
    }
  }
};

const log4Detail = (module, type, argv) => {
  let cost;
  switch (module) {
    case 'start':
      util.cleanScreen();
      cache.timer[type] = new Date();
      break;

    case 'finish':
      cost = new Date() - cache.timer[type];
      argv.push(`cost ${fn.costFormat(cost)}`);
      util.msg.success.apply(util.msg, argv);
      break;

    case 'msg':
      util.msg[type].apply(util.msg, argv);
      break;
  }
};

const log4Base = (module, type, argv) => {
  let iStatus = cache.status[cache.currentType];
  let cost;

  const prinitInfo = () => {
    let add = fn.numFormat(iStatus.adds.length);
    let upd = fn.numFormat(iStatus.updates.length);
    let del = fn.numFormat(iStatus.dels.length);
    let err = fn.numFormat(iStatus.errors.length);
    let war = fn.numFormat(iStatus.warns.length);
    util.infoBar.print(cache.currentType, {
      foot: util.getTime(),
      barLeft: `A ${add} U ${upd} D ${del}`,
      barRight: `${err} errors, ${war} warning`
    });
  };

  switch (module) {
    case 'start':
      console.log('');
      // util.cleanScreen();
      cache.timer[type] = new Date();
      cache.currentType = type;
      iStatus = cache.status[cache.currentType] = {
        errors: [],
        warns: [],
        adds: [],
        updates: [],
        dels: []
      };
      prinitInfo();
      break;

    case 'finish':
      util.infoBar.end();
      cost = new Date() - cache.timer[type];
      util.infoBar.print('done', {
        barLeft: argv.join(' '),
        barRight: `cost ${fn.costFormat(cost)}`,
        foot: util.getTime()
      }).end();
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

        case 'error':
          iStatus.errors.push(argv);
          break;

        case 'warn':
          iStatus.warns.push(argv);
          break;

        default:
          break;
      }
      prinitInfo();
      break;
  }
};

const log = (module, type, argv) => {
  const iArgv = util.type(argv) !== 'array' ? [argv] : argv;
  let logLevel = 1; // 临时
  return logLevel < 2 ?
    log4Base(module, type, iArgv) :
    log4Detail(module, type, iArgv);
};

module.exports = log;
