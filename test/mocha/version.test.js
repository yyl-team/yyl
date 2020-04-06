const chai = require('chai')
const expect = chai.expect
const yyl = require('../../index')
const util = require('yyl-util')

describe('version test', () => {
  it(
    'yyl -v',
    util.makeAsync(async () => {
      const v = await yyl.run('yyl -v --silent')
      expect(v).not.equal(undefined)
    }, true)
  )
  it(
    'yyl --version',
    util.makeAsync(async () => {
      const v = await yyl.run('yyl --version --silent')
      expect(v).not.equal(undefined)
    }, true)
  )
})
