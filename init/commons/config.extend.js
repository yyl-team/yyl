/* elint indent: [ "warn", 2 , {"SwitchCase": 1}] */
/* eslint no-unused-vars: "none" */
const path = require('path');
const config = {};
const setting = {};
const PLATFORM = __data('platform');

// + base
Object.assign(config, {
  workflow: __data('workflow'),
  name: __data('name'),
  version: __data('version'),
  platform: PLATFORM,
  proxy: setting.proxy,
  localserver: setting.localserver,
  commit: {}
});
// - base

// + vars
const COMMON_PATH = __data('commonPath');
const DEST_BASE_PATH = path.join(setting.localserver.root, setting.dest.basePath);
const SRC_ROOT = __data('srcRoot');
// - vars

module.exports = config;
