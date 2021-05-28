const command = require('../../')
const { expect } = require('chai')
describe('yyl seed', () => {
  it('yyl seed -h', async () => {
    const rs = await command({
      cmds: ['seed'],
      env: { silent: true },
      shortEnv: { h: true }
    })
    expect(rs).to.not.equal(undefined)
  })

  it('yyl seed --help', async () => {
    const rs = await command({
      cmds: ['seed'],
      env: { silent: true, help: true },
      shortEnv: {}
    })
    expect(rs).to.not.equal(undefined)
  })

  it('yyl seed -p', async () => {
    const rs = await command({
      cmds: ['seed'],
      env: { silent: true },
      shortEnv: {
        p: true
      }
    })
    expect(rs).to.not.equal(undefined)
  })

  it('yyl seed --path', async () => {
    const rs = await command({
      cmds: ['seed'],
      env: { silent: true, path: true },
      shortEnv: {}
    })
    expect(rs).to.not.equal(undefined)
  })

  it('yyl seed clear', async () => {
    const rs = await command({
      cmds: ['seed clear'],
      env: { silent: true },
      shortEnv: {}
    })
    expect(rs).to.not.equal(undefined)
  })

  it('yyl seed init', async () => {
    const rs = await command({
      cmds: ['seed init'],
      env: { silent: true },
      shortEnv: {}
    })
    expect(rs).to.not.equal(undefined)
  })

  it('yyl seed install yyl-seed-webpack', async () => {
    const rs = await command({
      cmds: ['seed install yyl-seed-webpack'],
      env: { silent: true },
      shortEnv: {}
    })
    expect(rs).to.not.equal(undefined)
  })

  it('yyl seed i yyl-seed-webpack', async () => {
    const rs = await command({
      cmds: ['seed install yyl-seed-webpack'],
      env: { silent: true },
      shortEnv: {}
    })
    expect(rs).to.not.equal(undefined)
  })
})
