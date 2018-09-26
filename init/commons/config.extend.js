/* elint indent: [ "warn", 2 , {"SwitchCase": 1}] */
/* eslint no-unused-vars: "none" */
const path = require('path');
const config = {};

// + vars
const PROJECT_NAME = __data('name');
const WORKFLOW = __data('workflow');
const PLATFORM = __data('platform');
const VERSION = __data('version');
const SRC_ROOT = __data('srcRoot');
const COMMON_PATH = __data('commonPath');
// - vars

const setting = {};

// + base
Object.assign(config, {
  workflow: WORKFLOW,
  name: PROJECT_NAME,
  version: VERSION,
  platform: PLATFORM,
  proxy: setting.proxy,
  localserver: setting.localserver,
  dest: setting.dest,
  commit: {}
});
// - base



module.exports = config;
