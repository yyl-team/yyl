const yyl = require('../index.js')
const util = require('yyl-util')
const path = require('path')

const handle = process.argv[2]
const iEnv = util.envParse(process.argv.slice(2))
console.log(iEnv)
console.log(handle)

const task = {
  async watch(iEnv) {
    const runPath = path.resolve(process.cwd(), iEnv.path)
    await yyl.run('watch', runPath)
  },
}

switch (handle) {
  case 'watch':
    task.watch(iEnv)
}
