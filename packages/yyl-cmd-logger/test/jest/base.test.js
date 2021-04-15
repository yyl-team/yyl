const YylCmdLogger = require('../../output')

test('yyLogger.log() 信息类型测试', () => {
  const logger = new YylCmdLogger({
    colunmSize: 80,
    logLevel: 0
  })
  expect(logger.log('info', ['1234567890'])).toEqual([
    `${logger.typeInfo.info.color(` ${logger.typeInfo.info.name} `)} 1234567890`
  ])

  expect(logger.log('warn', ['1234567890'])).toEqual([
    `${logger.typeInfo.warn.color(` ${logger.typeInfo.warn.name} `)} 1234567890`
  ])

  expect(logger.log('error', ['1234567890'])).toEqual([
    `${logger.typeInfo.error.color(` ${logger.typeInfo.error.name} `)} 1234567890`
  ])

  expect(logger.log('success', ['1234567890'])).toEqual([
    `${logger.typeInfo.success.color(` ${logger.typeInfo.success.name} `)} 1234567890`
  ])

  expect(logger.log('add', ['1234567890'])).toEqual([
    `${logger.typeInfo.add.color(` ${logger.typeInfo.add.name} `)} 1234567890`
  ])

  expect(logger.log('del', ['1234567890'])).toEqual([
    `${logger.typeInfo.del.color(` ${logger.typeInfo.del.name} `)} 1234567890`
  ])

  expect(logger.log('update', ['1234567890'])).toEqual([
    `${logger.typeInfo.update.color(` ${logger.typeInfo.update.name} `)} 1234567890`
  ])

  expect(logger.log('cmd', ['1234567890'])).toEqual([
    `${logger.typeInfo.cmd.color(` ${logger.typeInfo.cmd.name} `)} 1234567890`
  ])
})

test('yyLogger.log() lite 信息类型测试', () => {
  const logger = new YylCmdLogger({
    colunmSize: 80,
    logLevel: 0,
    lite: true
  })
  expect(logger.log('info', ['1234567890'])).toEqual([
    `${logger.typeInfo.info.shortColor(logger.typeInfo.info.shortName)} 1234567890`
  ])

  expect(logger.log('warn', ['1234567890'])).toEqual([
    `${logger.typeInfo.warn.shortColor(logger.typeInfo.warn.shortName)} 1234567890`
  ])

  expect(logger.log('error', ['1234567890'])).toEqual([
    `${logger.typeInfo.error.shortColor(logger.typeInfo.error.shortName)} 1234567890`
  ])

  expect(logger.log('success', ['1234567890'])).toEqual([
    `${logger.typeInfo.success.shortColor(logger.typeInfo.success.shortName)} 1234567890`
  ])

  expect(logger.log('add', ['1234567890'])).toEqual([
    `${logger.typeInfo.add.shortColor(logger.typeInfo.add.shortName)} 1234567890`
  ])

  expect(logger.log('del', ['1234567890'])).toEqual([
    `${logger.typeInfo.del.shortColor(logger.typeInfo.del.shortName)} 1234567890`
  ])

  expect(logger.log('update', ['1234567890'])).toEqual([
    `${logger.typeInfo.update.shortColor(logger.typeInfo.update.shortName)} 1234567890`
  ])

  expect(logger.log('cmd', ['1234567890'])).toEqual([
    `${logger.typeInfo.cmd.shortColor(logger.typeInfo.cmd.shortName)} 1234567890`
  ])
})
