const extFs = require('yyl-fs')
const fs = require('fs')
const path = require('path')
const chalk = require('chalk')

const vars = require('../lib/vars.js')

const PROFILE_PATH = path.join(vars.SERVER_DATA_PATH, 'profile.js')

const wProfile = function (key, val) {
  const she = wProfile
  if (!she.data) {
    she.init()
  }
  if (!arguments.length) {
    return she.data
  }

  if (val !== undefined) {
    //set
    she.data[key] = val
    she.save()
    return val
  } else {
    // get
    return she.data[key]
  }
}

wProfile.init = function () {
  const she = wProfile
  she.data = {}
  if (fs.existsSync(PROFILE_PATH)) {
    try {
      she.data = JSON.parse(fs.readFileSync(PROFILE_PATH, 'utf8'))
    } catch (er) {}
  } else {
    extFs.mkdirSync(path.dirname(PROFILE_PATH))
    fs.writeFileSync(PROFILE_PATH, '{}')
  }
}

wProfile.save = function () {
  const she = wProfile
  if (!she.data) {
    return
  }
  extFs.mkdirSync(path.dirname(PROFILE_PATH))
  fs.writeFileSync(PROFILE_PATH, JSON.stringify(she.data, null, 2))
}

wProfile.clear = function () {
  const she = wProfile
  she.data = {}
  she.save()
}

wProfile.print = function () {
  const she = wProfile
  she.init()

  const keyStr = (() => {
    const r = []
    Object.keys(she.data).forEach((key) => {
      switch (typeof she.data[key]) {
        case 'string':
          r.push(`${chalk.white.bold(key)}: ${she.data[key]}`)
          break
        case 'object':
          r.push(`${chalk.white.bold(key)}: ${JSON.stringify(she.data[key])}`)
          break

        default:
          return
      }
    })
    return r.join(' \n')
  })()

  console.log(
    [
      '',
      ` ${chalk.yellow.bold('profile path')}: ${chalk.yellow(PROFILE_PATH)}`,
      ` ${chalk.white.bold('data:')}`,
      ' ----------------------',
      ` ${keyStr}`,
      ' ----------------------',
      '',
    ].join('\n')
  )

  return Promise.resolve()
}

module.exports = wProfile
