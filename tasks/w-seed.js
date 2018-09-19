const fs = require('fs');
const wProfile = require('./w-profile.js');
const pkg = require('../package.json');

// + seed
const seeds = [
  'yyl-seed-gulp-requirejs'
];

const seedCache = {
  profileName: 'seedCache',
  get(workflow, key) {
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
    const she = this;
    if (typeof ctx == 'string' && ~seeds.indexOf(`yyl-seed-${ctx}`)) {
      return ctx;
    } else {
      const config = she.initConfig(ctx);
      if (config.workflow && ~seeds.indexOf(`yyl-seed-${config.workflow}`)) {
        return config.workflow;
      } else {
        return;
      }
    }
  },
  find(ctx) {
    const she = this;
    const workflow = she.ctx2workflow(ctx);
    if (workflow) {
      return require(`yyl-seed-${workflow}`);
    } else {
      return null;
    }
  },
  initConfig(ctx) {
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
    return config;
  },
  // 返回 config 中的 workflow 对应的可操作句柄
  getHandles(ctx) {
    const she = this;
    let config = null;
    const configs = [];

    // is configPath
    if (typeof ctx === 'string' && fs.existsSync(ctx)) {
      try {
        config = require(ctx);
      } catch (er) {}

      // 适配 multi config 情况
      if (config && !config.workflow) {
        Object.keys(config).forEach((key) => {
          if (config[key] && config[key].workflow) {
            configs.push(config[key]);
          }
        });
      }
    } else {
      config = she.initConfig(ctx);
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
