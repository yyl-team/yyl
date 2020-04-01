const cmd = require('./tasks/cmd.js')
const server = require('./tasks/server.js')

const init = require('./tasks/init.js')
const vars = require('./lib/vars.js')

const r = {
  run: async (ctx, cwd) => {
    let iArgv = ctx.split(/\s+/)

    if (iArgv[0] == 'yyl') {
      iArgv = iArgv.slice(1)
    }

    vars.init(cwd)

    return await cmd(...iArgv)
  },
  server,
  init,
}

module.exports = r
