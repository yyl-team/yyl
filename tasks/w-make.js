const util = require('yyl-util');

const SEED = require('./w-seed.js');
const log = require('../lib/log.js');
const vars = require('../lib/vars.js');
const Hander = require('yyl-hander');
const yh = new Hander({ vars, log });
const LANG = require('../lang/index');

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
    config = await yh.parseConfig(configPath, iEnv);
  } catch (er) {
    fn.exit(`yyl make fail, ${er}`);
  }
  log('msg', 'success', LANG.MAKE.PARSE_CONFIG_FINISHED);

  if (!config.workflow || SEED.workflows.indexOf(config.workflow) === -1) {
    fn.exit(`${LANG.MAKE.WORKFLOW_NOT_FOUND} [${config.workflow}]`);
  }

  const seed = SEED.find(config.workflow);

  if (!seed.make) {
    fn.exit(`${LANG.MAKE.WORKFLOW_MAKE_NOT_SET}: ${config.workflow}`);
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
