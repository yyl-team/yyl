const chai = require('chai')
const expect = chai.expect
const util = require('yyl-util')
const tUtil = require('yyl-seed-test-util')
const path = require('path')
const extFs = require('yyl-fs')
const Hander = require('yyl-hander')
const frp = require('yyl-file-replacer')
const fs = require('fs')

const vars = require('../../lib/vars')
const log = require('../../lib/log')
const yyl = require('../../index')
const request = require('yyl-request')

const FRAG_PATH = path.join(__dirname, '../__frag')

const yh = new Hander({ vars, log })
tUtil.frag.init(FRAG_PATH)

async function destCheck (projectPath, selfConfigPath) {
  let configPath = path.join(projectPath, 'config.js')
  if (selfConfigPath) {
    configPath = selfConfigPath
  }

  // check
  const config = await yh.parseConfig(configPath, {})
  const { destRoot } = config.alias
  const htmlList = await extFs.readFilePaths(destRoot, /\.html$/, true)
  const cssList = await extFs.readFilePaths(destRoot, /\.css$/, true)
  const jsList = await extFs.readFilePaths(destRoot, /\.js$/, true)

  const bothHostArr = []
  if (config.commit.mainHost) {
    bothHostArr.push(config.commit.mainHost)
  }
  if (config.commit.staticHost) {
    bothHostArr.push(config.commit.staticHost)
  }
  if (config.commit.hostname) {
    bothHostArr.push(config.commit.hostname)
  }
  const BOTH_SOURCE_REG = new RegExp(`^(${bothHostArr.join('|')})`)

  const remoteSource = []
  const localSource = []
  const bothMap = {}
  const sourcePickup = (iPath, dirname) => {
    const rPath = tUtil.hideUrlTail(iPath)
    if (rPath.match(frp.REG.HTML_IGNORE_REG)) { // 可忽略 的 url
      return
    } else if (rPath.match(frp.REG.IS_HTTP)) { // http
      remoteSource.push(rPath)
      if (rPath.match(BOTH_SOURCE_REG)) {
        bothMap[rPath] = path.join(destRoot, rPath.replace(BOTH_SOURCE_REG, ''))
      }
    } else if (rPath.match(frp.REG.HTML_IS_ABSLUTE)) { // 绝对地址 /
      localSource.push(path.join(destRoot, rPath))
    } else { // 相对地址
      localSource.push(path.join(dirname, rPath))
    }
  }

  htmlList.forEach((iPath) => {
    const ctx = fs.readFileSync(iPath).toString()
    frp.htmlPathMatch(ctx, (rPath) => {
      sourcePickup(rPath, path.dirname(iPath))
      return rPath
    })
  })
  cssList.forEach((iPath) => {
    const ctx = fs.readFileSync(iPath).toString()
    frp.cssPathMatch(ctx, (rPath) => {
      sourcePickup(rPath, path.dirname(iPath))
      return rPath
    })
  })
  jsList.forEach((iPath) => {
    const ctx = fs.readFileSync(iPath).toString()
    frp.jsPathMatch(ctx, (rPath) => {
      sourcePickup(rPath, path.dirname(iPath))
      return rPath
    })
  })

  const revPath = path.join(config.alias.revDest, 'rev-manifest.json')
  const hashMap = util.requireJs(revPath)

  // check hash map exist
  Object.keys(hashMap).forEach((key) => {
    if (!path.extname(key)) {
      return
    }
    const url1 = util.path.join(config.alias.revRoot, key)
    const url2 = util.path.join(config.alias.revRoot, hashMap[key])

    expect(fs.existsSync(url1)).to.equal(true)
    expect(fs.existsSync(url2)).to.equal(true)
  })

  localSource.forEach((iPath) => {
    expect(fs.existsSync(iPath)).to.equal(true)
  })

  await (() => {
    const NO_PROTOCOL = /^\/\/(\w)/
    return new Promise((next) => {
      const promiseArr = []
      remoteSource.forEach((iPath) => {
        var rPath = iPath
        if (rPath.match(NO_PROTOCOL)) {
          rPath = rPath.replace(NO_PROTOCOL, 'http://$1')
        }

        promiseArr.push(request(rPath))
      })
      Promise.all(promiseArr).then((values) => {
        values.forEach(([, res], i) => {
          const remoteUrl = remoteSource[i]
          if (res.statusCode !== 200 && bothMap[remoteUrl]) {
            expect(fs.existsSync(bothMap[remoteUrl])).to.equal(true)
          } else {
            expect(res.statusCode).to.equal(200)
          }
        })
        next()
      })
    })
  })()
}

describe('all test', () => {
  const FRAG_WORKFLOW_PATH = path.join(FRAG_PATH, 'gulp-requirejs')
  const ABSOLUTE_CONFIG_PATH = util.path.join(FRAG_WORKFLOW_PATH, 'config-test.js')
  const RELATIVE_CONFIG_PATH = 'config-test.js'

  before('test prepare', async () => {
    // frag init
    await tUtil.frag.build()

    // copy files
    const copyParam = {}
    copyParam[path.join(__dirname, '../case/commons')] = [
      path.join(FRAG_PATH, 'commons')
    ]
    copyParam[path.join(__dirname, '../case/gulp-requirejs')] = [
      path.join(FRAG_PATH, 'gulp-requirejs')
    ]
    await extFs.copyFiles(copyParam)
  })

  it('yyl all', async () => {
    const distPath = path.join(FRAG_WORKFLOW_PATH, 'dist')

    // clear dist
    await extFs.removeFiles(distPath)

    // run all
    await yyl.run('all --logLevel 0', FRAG_WORKFLOW_PATH)

    await destCheck(FRAG_WORKFLOW_PATH)
  }).timeout(0)

  it('yyl all --isCommit', async () => {
    const distPath = path.join(FRAG_WORKFLOW_PATH, 'dist')

    // clear dist
    await extFs.removeFiles(distPath)

    // run all
    await yyl.run('all --isCommit --logLevel 0', FRAG_WORKFLOW_PATH)

    await destCheck(FRAG_WORKFLOW_PATH)
  }).timeout(0)

  it(`yyl all --config ${ABSOLUTE_CONFIG_PATH}`, async () => {
    const distPath = path.join(FRAG_WORKFLOW_PATH, 'dist')

    // clear dist
    await extFs.removeFiles(distPath)

    // run all
    await yyl.run(`all --config ${ABSOLUTE_CONFIG_PATH} --logLevel 0`, FRAG_WORKFLOW_PATH)

    await destCheck(FRAG_WORKFLOW_PATH, ABSOLUTE_CONFIG_PATH)
  }).timeout(0)

  it(`yyl all --config ${RELATIVE_CONFIG_PATH}`, async () => {
    const distPath = path.join(FRAG_WORKFLOW_PATH, 'dist')

    // clear dist
    await extFs.removeFiles(distPath)

    // run all
    await yyl.run(`all --config ${RELATIVE_CONFIG_PATH} --logLevel 0`, FRAG_WORKFLOW_PATH)

    await destCheck(FRAG_WORKFLOW_PATH, ABSOLUTE_CONFIG_PATH)
  }).timeout(0)

  after('clear', async () => {
    await tUtil.frag.destroy()
  })
})