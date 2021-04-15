import path from 'path'
import { CHINESE_REG, COLOR_REG } from './const'
import { ChalkFunction } from 'chalk'
import readline from 'readline'

/** 创建多个字符串 */
export function buildChar(char: string, num: number) {
  return new Array(num + 1).join(char)
}

/** 创建多个空格 */
export function makeSpace(num: number) {
  return buildChar(' ', num)
}

/** 判断是否数组 */
export function isArray(ctx: any) {
  return typeof ctx === 'object' && ctx.splice === Array.prototype.splice
}

/** 类型获取 */
export function type(ctx: any) {
  return Object.prototype.toString
    .call(ctx)
    .replace(/^\[object (\w+)\]$/, '$1')
    .toLowerCase()
}

/** 隐藏 protocol 处理 */
export function hideProtocol(str: string) {
  if (typeof str === 'string') {
    return str.replace(/^http[s]?:/, '')
  } else {
    return str
  }
}

/** 格式化路径 */
export function formatUrl(url: string) {
  return url.split(path.sep).join('/')
}

/** 关键字替换 */
export function replaceKeyword(str: string, keyword: string, result: string) {
  return str
    .replace(new RegExp(` ${keyword}$`, 'g'), ` ${result}`)
    .replace(new RegExp(`^${keyword} `, 'g'), `${result} `)
    .replace(new RegExp(` ${keyword} `, 'g'), ` ${result} `)
    .replace(new RegExp(` ${keyword}([:,.]+)`, 'g'), ` ${result}$1`)
}

/** 转义用函数 */
export function toCtx<T>(i: any) {
  return i as T
}

// 去色
export function decolor(ctx: string | string[]) {
  if (isArray(ctx)) {
    return toCtx<string[]>(ctx).map((str) => str.replace(COLOR_REG, ''))
  } else {
    return toCtx<string>(ctx).replace(COLOR_REG, '')
  }
}

/** 获取带颜色的字符串长度 */
export function getStrSize(str: string) {
  const matchChats = str.match(CHINESE_REG) || []

  return decolor(str).length + matchChats.length
}

/** 格式化文字-配置 */
export interface StrAlignOption {
  /** 所占字符数 */
  size: number
  /** 对齐方式 */
  align: 'left' | 'right' | 'center'
}

/** 格式化文字(居中, 左, 右) */
export function strAlign(str: string, op: StrAlignOption) {
  const options = Object.assign(
    {
      size: 20,
      align: 'left'
    },
    op
  )

  const strLen = getStrSize(str)
  if (strLen >= op.size) {
    return str
  } else if (options.align === 'right') {
    return `${makeSpace(options.size - strLen)}${str}`
  } else if (options.align === 'center') {
    const isStrOdd = strLen % 2
    const isLenOdd = options.size % 2
    let spaceLeft = 0
    let spaceRight = 0
    if (isStrOdd === isLenOdd) {
      // 同奇同偶
      spaceLeft = spaceRight = (options.size - strLen) / 2
    } else {
      spaceLeft = Math.floor((options.size - strLen) / 2)
      spaceRight = spaceLeft + 1
    }
    return `${makeSpace(spaceLeft)}${str}${makeSpace(spaceRight)}`
  } else {
    // left
    return `${str}${makeSpace(options.size - strLen)}`
  }
}

export function substr(str: string, begin: number, len?: number) {
  const dos: string[] = []
  str.replace(COLOR_REG, (str) => {
    dos.push(str)
    return str
  })
  const strArr = str.split(COLOR_REG)
  const size = getStrSize(str)
  for (let i = 0; i < strArr.length; ) {
    if (strArr[i].match(COLOR_REG)) {
      strArr.splice(i, 1)
    } else {
      i++
    }
  }

  if (begin > size - 1) {
    return ''
  }

  let iLen = 0

  if (len === undefined) {
    iLen = size - 1 - begin
  } else if (begin + len > size - 1) {
    iLen = size - 1 - begin
  } else {
    iLen = len || 0
  }

  let r = ''
  let point = 0
  let isBegin = false
  let isEnd = false

  strArr.forEach((iStr, i) => {
    if (isEnd) {
      return
    }
    const strLen = getStrSize(iStr)

    if (!isBegin) {
      if (begin >= point && begin < point + strLen) {
        if (i % 2 !== 0) {
          r = `${dos[i - 1]}`
        }
        if (begin + iLen >= point && begin + iLen <= point + strLen) {
          r = `${r}${iStr.substr(
            getStrIndex(iStr, begin - point),
            getStrIndex(iStr, begin + iLen - point)
          )}`
          if (i % 2 !== 0 && i < dos.length) {
            r = `${r}${dos[i]}`
          }
          isEnd = true
        } else {
          r = `${r}${iStr.substr(getStrIndex(iStr, begin - point))}`
        }

        isBegin = true
      }
    } else {
      if (begin + iLen >= point && begin + iLen <= point + strLen) {
        // is end
        r = `${r}${dos[i - 1]}${iStr.substr(0, getStrIndex(iStr, begin + iLen - point))}`
        if (i % 2 !== 0 && i < dos.length) {
          r = `${r}${dos[i]}`
        }

        isEnd = true
        return true
      } else {
        // add it
        r = `${r}${dos[i - 1]}${iStr}`
      }
    }

    point += strLen
  })
  return r
}

/** 字符换行处理 */
export function strWrap(str: string, size: number, indent?: number) {
  const r: string[] = []
  const lines = `${str}`
    .trim()
    .split(/[\r\n]+/)
    .map((t) => (indent !== undefined ? t.trim() : t))

  let columnSize = 0
  let lineIndent = 0
  let lineNum = 0
  const addLineNum = function () {
    lineNum++
    if (lineNum === 1) {
      lineIndent = 0
      columnSize = size
    } else {
      lineIndent = indent || 0
      columnSize = size - lineIndent
    }
  }
  addLineNum()
  lines.forEach((line) => {
    if (getStrSize(line) > columnSize) {
      let fragStr = line

      while (getStrSize(fragStr) > columnSize) {
        r.push(`${makeSpace(lineIndent)}${substr(fragStr, 0, columnSize)}`)
        fragStr = substr(fragStr, columnSize)
        addLineNum()
      }
      if (getStrSize(fragStr) > 0) {
        r.push(`${makeSpace(lineIndent)}${fragStr}`)
        addLineNum()
      }
    } else {
      r.push(`${makeSpace(lineIndent)}${line}`)
      addLineNum()
    }
  })

  return r
}

/** 切割文字为数组 */
export function splitStr(str: string, maxLen: number) {
  const r = []
  if (!str) {
    r.push('')
  } else if (getStrSize(str) <= maxLen) {
    r.push(str)
  } else {
    // 切割字符
    let fragStr = str
    while (getStrSize(fragStr) > maxLen) {
      r.push(substr(fragStr, 0, maxLen))
      fragStr = substr(fragStr, maxLen)
    }
    if (getStrSize(fragStr) > 0) {
      r.push(fragStr)
    }
  }
  return r
}

export const cost = {
  source: {
    begin: 0,
    total: 0
  },
  start() {
    this.source.begin = +new Date()
    return this.source.begin
  },
  end() {
    this.source.total = +new Date() - this.source.begin
    return this.source.total
  },
  format(total: number) {
    const cost = total || this.source.total
    const min = Math.floor(cost / 1000 / 60)
    const sec = Math.floor(cost / 1000) % 60
    const us = cost % 1000
    let r = ''
    if (min) {
      r = `${r}${min}min`
    }
    if (sec) {
      r = `${r} ${sec}s`
    }
    if (us) {
      r = `${r} ${us}ms`
    }
    r = r.trim()
    return r
  }
}

export function timeFormat(t?: any) {
  let r
  if (t) {
    r = new Date(t)
  } else {
    r = new Date()
  }
  if (isNaN(+r)) {
    throw new Error(`print.timeFormat(t) error, t: ${t} is Invalid Date`)
  }

  return `${r}`.replace(/^.*(\d{2}:\d{2}:\d{2}).*$/, '$1')
}

export function dateFormat(t: any) {
  let r
  if (t) {
    r = new Date(t)
    if (typeof t === 'string' && !/:/.test(t)) {
      r.setHours(0, 0, 0, 0)
    }
  } else {
    r = new Date()
  }
  if (isNaN(+r)) {
    throw new Error(`print.dateFormat(t) error, t: ${t} is Invalid Date`)
  }

  const year = r.getFullYear()
  let mon = `${r.getMonth() + 1}`
  if (+mon < 10) {
    mon = `0${mon}`
  }
  let date = `${r.getDate()}`
  if (+date < 10) {
    date = `0${date}`
  }

  return `${year}-${mon}-${date} ${self.timeFormat(r)}`
}

/** 关键字高亮 map */
export interface HighlightMap {
  [keyword: string]: ChalkFunction
}

/** 关键字高亮 */
export function highlight(str: string, keywordMap: HighlightMap) {
  let r = str
  Object.keys(keywordMap).forEach((keyword) => {
    const color = keywordMap[keyword]
    r = replaceKeyword(r, keyword, color(keyword))
  })
  return r
}

/** 获取字符 index （中文字符算 2） */
export function getStrIndex(str: string, index: number) {
  let r = 0
  let count = 0
  for (let i = 0; i <= index && i < str.length; i++) {
    let add = 1
    if (str[i].match(CHINESE_REG)) {
      add = 2
    }
    if (count + add > index) {
      r = i
      break
    } else {
      count += add
    }
  }
  return r
}

/** 日志输出 - 配置 */
export interface PrintLogOption {
  logs: string[]
  backLine?: number
}

/** 日志输出 */
export function printLog(op: PrintLogOption) {
  const r = op.logs
  const stream = process.stderr
  let padding = op.backLine || 0
  while (padding) {
    readline.moveCursor(stream, 0, -1)
    readline.clearLine(stream, 1)
    padding--
  }

  readline.clearLine(process.stderr, 1)
  readline.cursorTo(process.stderr, 0)

  // print
  console.log(r.join('\n'))
}
