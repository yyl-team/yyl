const print = require('yyl-print')
const LANG = require('../lang/index')
const seed = require('../lib/seed')
function install({ cmds, env }) {
  console.log(cmds, env)
  // TODO:
}
install.help = ({ env }) => {
  const h = {
    usage: 'yyl install <package>',
    commands: {
      package: seed.packages.join(', ')
    },
    options: {
      '--force': LANG.INSTALL.HELP.FORCE
    }
  }
  if (!env.silent) {
    print.help(h)
  }
  return Promise.resolve(h)
}
module.exports = install
