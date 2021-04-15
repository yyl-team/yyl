const { TestScheduler } = require('jest')
const { initYylConfig } = require('../../')

test('usage test', () => {
  initYylConfig({
    projectInfo: {
      name: 'project_name',
      srcRoot: './src'
    }
  })
})
