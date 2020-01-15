'use strict';
// const path = require('path');
// const fs = require('fs');
const util = require('yyl-util');

const LANG = require('../lang/index');

const events = {
  help() {
    const h = {
      usage: 'yyl init',
      options: {
        '--help': LANG.INIT.HELP.HELP,
        '--cwd': LANG.INIT.HELP.CWD,
        '--nonpm': LANG.INIT.HELP.NO_NPM
      }
    };
    util.help(h);
    return Promise.resolve(h);
  },
  async init(/*env*/) {
    // TODO:
  }
};

const r = (env) => {
  if (env.h || env.help) {
    return events.help();
  } else {
    return events.init(env);
  }
};

r.help = () => {
  return events.help();
};

module.exports = r;
