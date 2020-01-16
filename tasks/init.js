'use strict';
// const path = require('path');
// const fs = require('fs');
const util = require('yyl-util');
const vars = require('../lib/vars.js');
const inquirer = require('inquirer');
const chalk = require('chalk');

const initMe = require('init-me');
const { seedFull2Short, seedShort2Full } = require('init-me/lib/formatter');
const { inYY } = require('init-me/lib/search');

const LANG = require('../lang/index');
const wSeed = require('./seed');

function printInfo ({ env, str }) {
  if (!env.silent) {
    console.log(`${chalk.yellow('!')} ${str}`);
  }
}

function printSuccess ({ env, str }) {
  if (!env.silent) {
    console.log(`${chalk.green('Y')} ${str}`);
  }
}

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
  async init(env) {

    // + rootSeed
    const { workflows } = wSeed;
    let rootSeed = env.rootSeed;
    if (!rootSeed || workflows.indexOf(rootSeed) === -1) {
      rootSeed = (await inquirer.prompt([{
        type: 'list',
        name: 'rootSeed',
        message: `${LANG.INIT.QUESTION.ROOT_SEED}:`,
        choices: wSeed.workflows,
        default: wSeed.workflows[0]
      }])).rootSeed;
    }
    // - rootSeed

    printInfo({ env, str: LANG.INIT.INFO.LOADIND_SEED });
    const seed = wSeed.find(rootSeed);

    const IN_YY = await inYY();
    if (IN_YY) {
      printSuccess({ env, str: LANG.INIT.INFO.IN_YY});
    }

    // + subSeed
    let subSeeds = seed.initPackage[IN_YY ? 'yy' : 'default'].map((name) => seedFull2Short(name));
    let subSeed = env.subSeed;
    if (!subSeed || subSeed.indexOf(subSeeds) === -1) {
      if (subSeeds.length > 1) {
        subSeed = (await inquirer.prompt([{
          type: 'list',
          name: 'subSeed',
          choices: subSeeds,
          default: subSeeds[0],
          message: `${LANG.INIT.QUESTION.SUB_SEED}`
        }])).subSeed;
      } else {
        subSeed = subSeeds[0];
      }
    }
    // - subSeed

    printInfo({ env, str: LANG.INIT.INFO.LOADING_INIT_ME});


    // + 执行 init-me
    await initMe.init(vars.PROJECT_PATH, {
      env: Object.assign(env, {
        seed: seedShort2Full(subSeed)
      }),
      inset: true
    });
    // - 执行 init-me
    // TODO: 检查是否处于 yy 环境下
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
