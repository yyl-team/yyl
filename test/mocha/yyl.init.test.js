const command = require('../../')
const { expect } = require('chai')
const extFs = require('yyl-fs')
const path = require('path')
const FRAG_PATH = path.join(__dirname, '../__frag')
describe('yyl init', () => {
  it('yyl init -h', async () => {
    const rs = await command({
      cmds: ['init'],
      env: { silent: true },
      shortEnv: { h: true }
    })
    expect(rs).to.not.equal(undefined)
  })

  it('yyl init --help', async () => {
    const rs = await command({
      cmds: ['init'],
      env: { silent: true, help: true },
      shortEnv: {}
    })
    expect(rs).to.not.equal(undefined)
  })

  it('yyl init yyl-seed-other', async () => {
    // 初始化
    const context = path.join(FRAG_PATH, 'yyl_init_other')
    await extFs.mkdirSync(context)
    await extFs.removeFiles(context)
    const rs = await command({
      cmds: ['init'],
      shortEnv: {},
      env: {
        rootSeed: 'yyl-seed-other',
        name: 'yyl_init_other',
        silent: true
      }
    })
    expect(rs).to.equal(undefined)
  })
})
