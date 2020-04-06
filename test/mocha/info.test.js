const chai = require('chai')
const expect = chai.expect
const util = require('yyl-util')

const yyl = require('../../index')
const LANG = require('../../lang/index')

describe('info test', () => {
  it(
    'yyl info',
    util.makeAsync(async () => {
      const workflowPath = util.path.join(__dirname, '../case/gulp-requirejs')
      const info = await yyl.run('yyl info --silent', workflowPath)
      expect(info[LANG.INFO.DETAIL.NAME]).to.equal('gulp-requirejs')
    }, true)
  )
})
