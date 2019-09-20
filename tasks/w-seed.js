const fs = require('fs');
const wProfile = require('./w-profile.js');
const pkg = require('../package.json');
const log = require('../lib/log.js');
const chalk = require('chalk');
const LANG = require('../lang/index');

// + seed
const seeds = [
  'yyl-seed-gulp-requirejs',
  'yyl-seed-webpack'
];

const seedCache = {
  profileName: 'seedCache',
  get(workflow, key) {
    // + 兼容 旧版
    if (workflow === 'webpack-vue2') {
      workflow = 'webpack';
    }
    // - 兼容 旧版

    let ver = pkg.dependencies[`yyl-seed-${workflow}`];
    if (!ver) {
      return [];
    }
    ver = ver.replace(/^[\^~]/, '');
    let iCache = wProfile(seedCache.profileName);

    if (
      iCache &&
      iCache[workflow] &&
      iCache[workflow][ver] &&
      iCache[workflow][ver][key]

    ) {
      return iCache[workflow][ver][key];
    } else {
      return seedCache.save(workflow, key);
    }
  },
  save(workflow, key) {
    console.log(`${chalk.green('!')} ${chalk.green.bold(`${LANG.SEED.LOADING}: `)} ${chalk.yellow(workflow)}, ${LANG.SEED.PLEASE_WAIT}`);
    const seed = SEED.find(workflow);
    const iCache = wProfile(seedCache.profileName) || {};
    if (!seed) {
      return [];
    }
    if (!iCache[workflow]) {
      iCache[workflow] = {};
    }
    iCache[workflow][seed.version] = {
      examples: [].concat(seed.examples),
      handles: [].concat(seed.optimize.handles)
    };

    wProfile(seedCache.profileName, iCache);

    if (key in iCache[workflow][seed.version]) {
      return iCache[workflow][seed.version][key];
    } else {
      return [];
    }
  }
};

const SEED = {
  // config, configPath, workflowName in, useful workflow out
  ctx2workflow(ctx) {
    if (typeof ctx == 'string' && ~seeds.indexOf(`yyl-seed-${ctx}`)) {
      return ctx;
    } else if (typeof ctx === 'object') {
      const config = ctx;
      if (config.workflow && ~seeds.indexOf(`yyl-seed-${config.workflow}`)) {
        return config.workflow;
      }
    } else {
      return;
    }
  },
  find(ctx) {
    const she = this;
    let workflow = she.ctx2workflow(ctx);
    if (workflow) {
      return require(`yyl-seed-${workflow}`);
    } else {
      return null;
    }
  },
  initConfig(ctx, iEnv) {
    let config = null;
    if (typeof ctx === 'object') {
      config = ctx;
    } else if (typeof ctx === 'string') {
      if (!fs.existsSync(ctx)) {
        return null;
      } else {
        try {
          config = require(ctx);
        } catch (er) {}
      }
    } else {
      return null;
    }
    if (typeof config === 'function') {
      config = config({ env: iEnv });
    }
    return config;
  },
  // 返回 config 中的 workflow 对应的可操作句柄
  getHandles(ctx, iEnv) {
    const she = this;
    let config = null;
    const configs = [];

    // is configPath
    if (typeof ctx === 'string' && fs.existsSync(ctx)) {
      try {
        config = require(ctx);
      } catch (er) {
        log('msg', 'warn', [`${LANG.SEED.PARSE_CONFIG_ERROR}: ${ctx}`, er]);
      }

      if (typeof config === 'function') {
        config = config({env: iEnv});
      }

      // 适配 multi config 情况
      if (config && !config.workflow) {
        Object.keys(config).forEach((key) => {
          if (config[key] && config[key].workflow) {
            configs.push(config[key]);
          }
        });
      } else {
        config = she.initConfig(ctx, iEnv);
        if (config && config.workflow) {
          configs.push(config);
        }
      }
    } else {
      config = she.initConfig(ctx, iEnv);
      if (config && config.workflow) {
        configs.push(config);
      }
    }
    if (!configs.length) {
      return null;
    }

    let r = [];

    configs.forEach((iConfig) => {
      const { workflow } = iConfig;
      seedCache.get(workflow, 'handles').forEach((key) => {
        if (r.indexOf(key) === -1) {
          r.push(key);
        }
      });
    });
    return r;
  },
  getExamples(workflow) {
    return seedCache.get(workflow, 'examples');
  },
  workflows: seeds.map((str) => str.replace(/^yyl-seed-/, ''))
};

module.exports = SEED;
