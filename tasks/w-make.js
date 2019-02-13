const util = require('yyl-util');

const SEED = require('./w-seed.js');
const extFn = require('../lib/extFn.js');
const log = require('../lib/log.js');

const fn = {
  exit(errMsg) {
    log('msg', 'error', errMsg);
    log('finish');
  }
};

async function wMake (name, iEnv, configPath) {
  log('clear');
  log('cmd', `yyl make ${name} ${util.envStringify(iEnv)}`);
  log('start', 'make');

  let config = null;

  try {
    config = await extFn.parseConfig(configPath, iEnv);
  } catch (er) {
    fn.exit(`yyl make fail, ${er}`);
  }
  log('msg', 'success', 'parse config finished');

  if (!config.workflow || SEED.workflows.indexOf(config.workflow) === -1) {
    fn.exit(`yyl make fail, cannot find seed name [${config.workflow}]`);
  }

  const seed = SEED.find(config.workflow);

  if (!seed.make) {
    fn.exit(`yyl make fail, seed[${config.workflow}].make is not set`);
  }

  const runner = function () {
    return new Promise((next, reject) => {
      seed.make(name, config)
        .on('msg', (type, argv) => {
          log('msg', type, argv);
        })
        .on('error', (err) => {
          reject(err);
        })
        .on('finished', () => {
          next();
        });
    });
  };

  await runner();
  log('finish');
}

module.exports = wMake;
