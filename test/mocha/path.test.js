const chai = require('chai')
const expect = chai.expect
const util = require('yyl-util')

const yyl = require('../../index')
const vars = require('../../lib/vars')

describe('path test', () => {
  it(
    'yyl -p',
    util.makeAsync(async () => {
      const p = await yyl.run('yyl -p --silent')
      expect(p).to.equal(vars.BASE_PATH)
    }, true)
  )

  it(
    'yyl --path',
    util.makeAsync(async () => {
      const p = await yyl.run('yyl -p --silent')
      expect(p).to.equal(vars.BASE_PATH)
    }, true)
  )
})
