const fs = require('fs');
const wProfile = require('./w-profile.js');

// + seed
const seeds = [
  'yyl-seed-gulp-requirejs'
];

const SEED = {
  find(ctx) {
    const she = this;
    const config = she.initConfig(ctx);
    if (!config) {
      return null;
    }

    const { workflow } = config;
    const seedName = `yyl-seed-${workflow}`;

    if (!~seeds.indexOf(seedName)) {
      return null;
    }
    return require(seedName);
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
  }
};

module.exports = SEED;
