const command = require('../../')
const { expect } = require('chai')
describe('yyl options test', () => {
  it('yyl -h', async () => {
    const rs = await command({
      cmds: [],
      env: { silent: true },
      shortEnv: { h: true }
    })
    expect(rs).to.not.equal(undefined)
  })
  it('yyl --help', async () => {
    const rs = await command({
      cmds: [],
      env: { silent: true, help: true },
      shortEnv: {}
    })
    expect(rs).to.not.equal(undefined)
  })

  it('yyl -p', async () => {
    const rs = await command({
      cmds: [],
      env: { silent: true },
      shortEnv: {
        p: true
      }
    })
    expect(rs).to.not.equal(undefined)
  })

  it('yyl --path', async () => {
    const rs = await command({
      cmds: [],
      env: { silent: true, path: true },
      shortEnv: {}
    })
    expect(rs).to.not.equal(undefined)
  })

  it('yyl -v', async () => {
    const rs = await command({
      cmds: [],
      env: { silent: true },
      shortEnv: {
        v: true
      }
    })
    expect(rs).to.not.equal(undefined)
  })

  it('yyl --version', async () => {
    const rs = await command({
      cmds: [],
      env: { silent: true, version: true },
      shortEnv: {}
    })
    expect(rs).to.not.equal(undefined)
  })
})
