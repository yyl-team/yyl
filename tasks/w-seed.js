const fs = require('fs');
const wProfile = require('./w-profile.js');

// + seed
const seeds = [
  'yyl-seed-gulp-requirejs'
];

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
    const config = she.initConfig(ctx);
    if (!config) {
      return null;
    }

    const { workflow } = config;
    let handleMap = wProfile('handleMap');
    if (handleMap && handleMap[workflow]) {
      return handleMap[workflow];
    } else {
      const seed = she.find(config);
      if (!seed) {
        return null;
      }

      const handles = [].concat(seed.optimize.handles);
      if (!handleMap) {
        handleMap = {};
      }
      handleMap[workflow] = handles;
      wProfile('handleMap', handleMap);
      return handles;
    }
  },
  workflows: seeds.map((str) => str.replace(/^yyl-seed-/, ''))
};

module.exports = SEED;
