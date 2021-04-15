import chalk, { ChalkFunction } from 'chalk'
import readline from 'readline'
import { event } from '../typing/global'
import { COLUMNS } from './const'
import {
  getStrSize,
  type as checkType,
  strWrap,
  toCtx,
  HighlightMap,
  highlight,
  makeSpace,
  printLog,
  timeFormat
} from './util'

export type LogLevel = 0 | 1 | 2

export type ProgressStatus = 'start' | 'finished' | number

/** type 类型 */
export interface TypeObject {
  name: string
  shortName: string
  color: ChalkFunction
  shortColor: ChalkFunction
}

/** 基础类型 */
export interface TypeInfo {
  info: TypeObject
  warn: TypeObject
  error: TypeObject
  success: TypeObject
  cmd: TypeObject
  add: TypeObject
  del: TypeObject
  update: TypeObject
  [key: string]: TypeObject
}

/** 日志类型 */
export type LogType = keyof TypeInfo

export interface ExtendType {
  [key: string]: TypeObject
}

export interface ProgressInfo {
  /** 长版 icon */
  icons?: string[]
  /** 简版 icon */
  shortIcons?: string[]
  /** 长版 颜色 */
  color?: ChalkFunction
  /** 简版 颜色 */
  shortColor?: ChalkFunction
}

/** logger - 配置 */
export interface YylCmdLoggerOption {
  /** 日志等级 0 - 没有, 1 - 简单, 2 - 详细 */
  logLevel?: LogLevel
  /** 是否进行 type 简化 */
  lite?: boolean
  /** 附加 type */
  type?: ExtendType
  /** 关键字高亮 */
  keywordHighlight?: HighlightMap
  /** 进度相关属性 */
  progressInfo?: ProgressInfo
  /** cmd 一行长度,用于自测时使用 */
  columnSize?: number
}

/** log 格式化配置 */
export interface FormatLogOption {
  name: string
  color: ChalkFunction
  args: any[]
}

/** logger - 属性 */
type YylCmdLoggerProperty = Required<YylCmdLoggerOption>

/** 进度相关信息 */
export interface ProgressStat<T extends string = ''> {
  /** 是否正在执行 */
  progressing: boolean
  /** 执行百分比 */
  percent: number
  /** 刷新间隔 */
  interval: number
  /** 最后一个 log 内容 */
  lastLogs: any[]
  /** success logs 内容 */
  successLogs: any[][]
  /** error logs 内容 */
  errorLogs: any[][]
  /** warn logs 内容 */
  warnLogs: any[][]
  /** 新增文件 logs 内容 */
  addLogs: any[][]
  /** 更新文件 logs 内容 */
  updateLogs: any[][]
  /** 删除文件 logs 内容 */
  delLogs: any[][]
  /** 最后一个 log 类型 */
  lastType: LogType | T
  /** 最后一个log行数 */
  lastRowsCount: number
  /** 当前 icon 帧数 */
  frameCurrent: number
  /** intervalkey */
  intervalKey: any
  /** 开始时间 */
  startTime: number
}

/** logger 对象 */
export class YylCmdLogger<T extends string = ''> {
  typeInfo: TypeInfo = {
    info: {
      name: 'INFO',
      color: chalk.bgBlack.gray,
      shortName: 'i',
      shortColor: chalk.gray
    },
    warn: {
      name: 'WARN',
      shortName: '!',
      color: chalk.bgYellow.black,
      shortColor: chalk.yellow
    },
    error: {
      name: 'ERR ',
      shortName: 'x',
      color: chalk.bgRed.white,
      shortColor: chalk.red
    },
    success: {
      name: 'PASS',
      shortName: 'Y',
      color: chalk.bgCyan.white,
      shortColor: chalk.cyan
    },
    del: {
      name: 'DEL ',
      shortName: '-',
      color: chalk.bgGray.black,
      shortColor: chalk.gray
    },
    add: {
      name: 'ADD ',
      shortName: '+',
      color: chalk.bgBlue.white,
      shortColor: chalk.blue
    },
    update: {
      name: 'UPDT',
      shortName: '~',
      color: chalk.bgMagenta.white,
      shortColor: chalk.magenta
    },
    cmd: {
      name: 'CMD>',
      shortName: '>',
      color: chalk.bgBlack.white,
      shortColor: chalk.white
    }
  }

  /** progress icon 信息 */
  progressInfo: Required<YylCmdLoggerProperty['progressInfo']> = {
    icons: ['----', '---L', '-LOA', 'LOAD', 'OADI', 'ADIN', 'DING', 'ING-', 'NG--', 'G---'],
    shortIcons: ['L', 'O', 'A', 'D', 'I', 'N', 'G'],
    color: chalk.bgRed.white,
    shortColor: chalk.red
  }

  logLevel: YylCmdLoggerProperty['logLevel'] = 1
  lite: YylCmdLoggerProperty['lite'] = false
  keywordHighlight: YylCmdLoggerProperty['keywordHighlight'] = {
    finished: chalk.green,
    failed: chalk.red,
    start: chalk.cyan,
    passed: chalk.green,
    success: chalk.green,
    完成: chalk.green,
    成功: chalk.green,
    失败: chalk.red,
    错误: chalk.red,
    出错: chalk.red,
    开始: chalk.cyan
  }

  columnSize: YylCmdLoggerProperty['columnSize'] = COLUMNS

  progressStat: ProgressStat<T> = {
    progressing: false,
    percent: 0,
    interval: 100,
    lastLogs: [],
    successLogs: [],
    warnLogs: [],
    errorLogs: [],
    addLogs: [],
    delLogs: [],
    updateLogs: [],
    lastType: 'info',
    lastRowsCount: 0,
    frameCurrent: 0,
    intervalKey: undefined,
    startTime: 0
  }

  constructor(op?: YylCmdLoggerOption) {
    // 日志类型配置
    if (op?.type) {
      this.typeInfo = {
        ...this.typeInfo,
        ...op.type
      }
    }
    // 日志等级配置
    if (op?.logLevel !== undefined) {
      this.logLevel = op.logLevel
    }

    // 轻量版配置
    if (op?.lite !== undefined) {
      this.lite = op.lite
    }

    // 关键字高亮配置初始化
    if (op?.keywordHighlight) {
      this.keywordHighlight = {
        ...this.keywordHighlight,
        ...op.keywordHighlight
      }
    }

    // progress 初始化
    if (op?.progressInfo) {
      this.progressInfo = {
        ...this.progressInfo,
        ...op.progressInfo
      }
    }

    // 行宽设置
    if (op?.columnSize) {
      this.columnSize = op.columnSize
    }
  }

  /** 获取 progress headline */
  protected getProgressHeadline(): string {
    const { progressStat, typeInfo } = this
    const precentStr = Math.round(progressStat.percent * 1000) / 10
    const now = +new Date()
    let headlineStr = `${precentStr}%`

    // 输出 耗时
    if (progressStat.startTime) {
      const costStr = `${(now - progressStat.startTime) / 1000}s`
      headlineStr = `${headlineStr} ${costStr}`
    }

    // 输出 新增文件 信息
    if (progressStat.addLogs.length) {
      headlineStr = `${headlineStr} ${typeInfo.add.shortColor(typeInfo.add.shortName)} ${
        progressStat.addLogs.length
      }`
    }

    // 输出 更新文件 信息
    if (progressStat.updateLogs.length) {
      headlineStr = `${headlineStr} ${typeInfo.update.shortColor(typeInfo.update.shortName)} ${
        progressStat.updateLogs.length
      }`
    }

    // 输出 删除文件 信息
    if (progressStat.delLogs.length) {
      headlineStr = `${headlineStr} ${typeInfo.del.shortColor(typeInfo.del.shortName)} ${
        progressStat.delLogs.length
      }`
    }

    // 输出 警告 信息
    if (progressStat.warnLogs.length) {
      headlineStr = `${headlineStr} ${typeInfo.warn.shortColor(typeInfo.warn.shortName)} ${
        progressStat.warnLogs.length
      }`
    }

    // 输出 错误 信息
    if (progressStat.errorLogs.length) {
      headlineStr = `${headlineStr} ${typeInfo.error.shortColor(typeInfo.error.shortName)} ${
        progressStat.errorLogs.length
      }`
    }

    return headlineStr
  }

  /** 私有方法 - 更新 progress */
  protected updateProgress(): string[] {
    const { progressStat, logLevel, lite, progressInfo, typeInfo } = this
    if (!progressStat.progressing) {
      return []
    }

    // prefix
    const frameLength = lite ? progressInfo.shortIcons.length : progressInfo.icons.length
    const frameCurrent = (progressStat.frameCurrent + 1) % frameLength
    const name = lite
      ? progressInfo.shortIcons[frameCurrent]
      : ` ${progressInfo.icons[frameCurrent]} `
    const color = lite ? progressInfo.shortColor : progressInfo.color

    // headline
    const headlineStr = this.getProgressHeadline()

    // last type
    let lastTypeInfo: TypeObject = typeInfo.info
    const lastType = toCtx<keyof TypeInfo>(progressStat.lastType)
    if (lastType in typeInfo) {
      lastTypeInfo = typeInfo[lastType]
    }

    const lastTypeStr = lastTypeInfo.shortColor(lastTypeInfo.shortName)

    lastTypeInfo = typeInfo[lastType]

    const r = this.formatLog({
      name,
      color,
      args: [headlineStr, lastTypeStr].concat(progressStat.lastLogs)
    })

    // print
    if (logLevel === 1) {
      printLog({
        backLine: progressStat.lastRowsCount || 0,
        logs: r
      })
    }

    // 记录 log 占用行数
    progressStat.lastRowsCount = r.length
    progressStat.frameCurrent = frameCurrent

    return r
  }

  /** progress finished 处理函数 */
  protected finishedProgress(): string[] {
    const { logLevel, progressStat } = this

    // 清除计时器
    if (this.progressStat.intervalKey) {
      clearInterval(this.progressStat.intervalKey)
    }

    // 状态复位
    this.progressStat = {
      ...this.progressStat,
      percent: 1,
      progressing: false,
      intervalKey: undefined
    }

    const headlineStr = `${this.getProgressHeadline()} ${chalk.green('at')} ${chalk.yellow(
      timeFormat()
    )}`

    // print
    if (logLevel !== 0) {
      const stream = process.stderr
      if (logLevel === 1) {
        let padding = progressStat.lastRowsCount || 0
        while (padding) {
          readline.moveCursor(stream, 0, -1)
          readline.clearLine(stream, 1)
          padding--
        }
      }

      readline.clearLine(process.stderr, 1)
      readline.cursorTo(process.stderr, 0)
    }

    const isError = this.progressStat.errorLogs.length > 0
    const logType = isError ? 'error' : 'success'
    let logs: any[] = [headlineStr]

    if (logLevel === 1) {
      if (isError) {
        this.progressStat.errorLogs.forEach((args) => {
          logs = logs.concat(args)
        })
      } else {
        this.progressStat.successLogs.forEach((args) => {
          logs = logs.concat(args)
        })
      }
    }

    let r = this.log(logType, logs)
    if (logLevel === 1) {
      if (!isError && this.progressStat.warnLogs.length > 0) {
        this.progressStat.warnLogs.forEach((args) => {
          r = r.concat(this.log('warn', args))
        })
      }
    }
    return r
  }

  /** 格式化日志 */
  protected formatLog(op: FormatLogOption) {
    const { name, color, args } = op
    const { keywordHighlight, columnSize } = this
    // 第一行标题
    const prefix = color(name)
    // 第二行标题
    const subfix = color(makeSpace(getStrSize(name)))

    const prefixSize = getStrSize(prefix)
    const contentSize = columnSize - prefixSize - 2

    let fArgs: string[] = []
    args.forEach((ctx) => {
      let cnt = ''
      const iType = checkType(ctx)
      if (['number', 'string', 'undefined'].includes(iType)) {
        cnt = `${ctx}`
        fArgs = fArgs.concat(strWrap(cnt, contentSize))
      } else if (iType === 'error') {
        const iCtx = toCtx<Error>(ctx)
        fArgs = fArgs.concat(strWrap(iCtx.stack || iCtx.message, contentSize))
      } else if (iType === 'object') {
        const iCtx = toCtx<Object>(ctx)
        fArgs = fArgs.concat(strWrap(JSON.stringify(iCtx, null, 2), contentSize))
      } else {
        fArgs.push(`${cnt}`)
      }
    })
    const r: string[] = []

    fArgs.forEach((ctx, i) => {
      let front = prefix
      if (i !== 0) {
        front = subfix
      }
      if (checkType(ctx) === 'string') {
        r.push(`${front} ${highlight(ctx, keywordHighlight)}`)
      } else {
        if (i === 0) {
          r.push(`${front}`)
        }
        r.push(ctx)
      }
    })
    return r
  }

  protected addProgressLog(type: LogType | T, args: any[]): string[] {
    const { progressStat } = this
    const iType = this.formatLogInfo(type).type
    switch (iType) {
      case 'warn':
        progressStat.warnLogs.push(args)
        break
      case 'error':
        progressStat.errorLogs.push(args)
        break
      case 'success':
        progressStat.successLogs.push(args)
        break

      case 'update':
        progressStat.updateLogs.push(args)
        break
      case 'add':
        progressStat.addLogs.push(args)
        break
      case 'remove':
        progressStat.delLogs.push(args)
        break

      default:
        break
    }
    progressStat.lastLogs = args
    progressStat.lastType = iType
    return this.updateProgress()
  }

  /** 格式化 logInfo */
  protected formatLogInfo(type: LogType | T) {
    const { typeInfo } = this
    let iTypeInfo = typeInfo[type]
    if (!iTypeInfo) {
      iTypeInfo = typeInfo.info
      type = 'info'
    }
    return {
      type,
      info: iTypeInfo
    }
  }

  protected normalLog(type: LogType | T, args: any[]): string[] {
    const { lite, logLevel } = this
    const iTypeInfo = this.formatLogInfo(type).info

    // 日志格式化处理
    const r = this.formatLog({
      name: lite ? iTypeInfo.shortName : ` ${iTypeInfo.name} `,
      color: lite ? iTypeInfo.shortColor : iTypeInfo.color,
      args
    })

    if (logLevel !== 0) {
      printLog({
        logs: r
      })
    }

    return r
  }

  /** 设置 progress 状态 */
  setProgress(status: ProgressStatus, type?: LogType | T, args?: any[]) {
    const { progressStat } = this
    if (status === 'start') {
      // 防止多次 启动 progress
      if (progressStat.progressing) {
        if (args && type && this.logLevel === 1) {
          this.log(type, args)
        }
        return
      }

      // 进入 progress 模式
      if (this.progressStat.intervalKey) {
        clearInterval(this.progressStat.intervalKey)
      }

      this.progressStat = {
        ...this.progressStat,
        errorLogs: [],
        successLogs: [],
        warnLogs: [],
        percent: 0,
        progressing: true,
        startTime: +new Date(),
        intervalKey: setInterval(() => {
          this.updateProgress()
        }, this.progressStat.interval)
      }
    } else if (status === 'finished') {
      if (type && args && this.progressStat.progressing && this.logLevel === 1) {
        this.log(type, args)
      }
      // 退出 progress 模式
      this.finishedProgress()
    } else {
      // 更新 progress 进度
      this.progressStat = {
        ...this.progressStat,
        percent: status
      }
      if (type && args && this.progressStat.progressing && this.logLevel === 1) {
        this.log(type, args)
      }
    }
    this.updateProgress()
  }

  /** 设置日志等级 */
  setLogLevel(level: LogLevel) {
    this.logLevel = level
  }

  /** 日志输出 */
  log(type: LogType | T, args: any[]): string[] {
    const { progressStat, logLevel } = this
    if (!args) {
      return []
    }

    if (progressStat.progressing) {
      if (logLevel === 1) {
        return this.addProgressLog(type, args)
      } else if (logLevel === 2) {
        this.addProgressLog(type, args)
        return this.normalLog(type, args)
      }
    }

    return this.normalLog(type, args)
  }
}

module.exports = YylCmdLogger
