/* elint indent: [ "warn", 2 , {"SwitchCase": 1}]*/
const config = {};
const setting = {};

// + base
config.assign(config, {
  workflow: __data('workflow'),
  name: __data('name'),
  version: __data('version'),
  platform: __data('platform'),
  proxy: setting.proxy,
  localserver: setting.localserver
});
// - base

module.exports = config;
