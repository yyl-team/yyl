/* elint indent: [ "warn", 2 , {"SwitchCase": 1}] */
/* eslint no-unused-vars: "none" */
const path = require('path');
const config = {};
const setting = {};
const PLATFORM = __data('platform');

// + vars
const PROJECT_NAME = __data('name');
const VERSION = __data('version');
const WORKFLOW = __data('workflow');
const COMMON_PATH = __data('commonPath');
const SRC_ROOT = __data('srcRoot');
// - vars

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
