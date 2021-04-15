const YylCmdLogger = require('../../output')

test('yyLogger.log() 非中文换行问题', () => {
  const logger = new YylCmdLogger({
    columnSize: 80,
    logLevel: 0
  })
  expect(
    logger.log('info', [
      [
        '1234567890',
        '1234567890',
        '1234567890',
        '1234567890',
        '1234567890',
        '1234567890',
        '1234567890',
        '1234567890',
        '1234567890'
      ].join('')
    ])
  ).toEqual([
    `${logger.typeInfo.info.color(
      ` ${logger.typeInfo.info.name} `
    )} 123456789012345678901234567890123456789012345678901234567890123456789012`,
    `${logger.typeInfo.info.color('      ')} 345678901234567890`
  ])
})

test('yyLogger.log() 中文换行问题', () => {
  const logger = new YylCmdLogger({
    columnSize: 80,
    logLevel: 0
  })
  expect(
    logger.log('info', [
      [
        '一二三四五六七八九十',
        '一二三四五六七八九十',
        '一二三四五六七八九十',
        '一二三四五六七八九十',
        '一二三四五六七八九十',
        '一二三四五六七八九十'
      ].join('')
    ])
  ).toEqual([
    `${logger.typeInfo.info.color(
      ` ${logger.typeInfo.info.name} `
    )} 一二三四五六七八九十一二三四五六七八九十一二三四五六七八九十一二三四五六`,
    `${logger.typeInfo.info.color('      ')} 七八九十一二三四五六七八九十一二三四五六七八九十`
  ])
})

test('yyLogger.log() 混合字符问题', () => {
  const logger = new YylCmdLogger({
    columnSize: 80,
    logLevel: 0
  })
  expect(
    logger.log('info', [
      [
        '一二三四五六七八九十',
        '1234567890',
        '一二三四五六七八九十',
        '1234567890',
        '一二三四五六七八九十',
        '1234567890'
      ].join('')
    ])
  ).toEqual([
    `${logger.typeInfo.info.color(
      ` ${logger.typeInfo.info.name} `
    )} 一二三四五六七八九十1234567890一二三四五六七八九十1234567890一二三四五六`,
    `${logger.typeInfo.info.color('      ')} 七八九十1234567890`
  ])
})
