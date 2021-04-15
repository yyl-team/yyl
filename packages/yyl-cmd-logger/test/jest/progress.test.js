const YylCmdLogger = require('../../output')

test('yyLogger.log() progress 测试', () => {
  const logger = new YylCmdLogger({
    colunmSize: 80,
    logLevel: 0
  })

  logger.setProgress('start')
  logger.setProgress(0.1)
  logger.setProgress(0.5)
  logger.setProgress(0.9)
  logger.setProgress('finished')
})
