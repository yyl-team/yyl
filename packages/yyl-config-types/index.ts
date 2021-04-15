import { Express } from 'express'
/** 平台类型 */
export declare type PlatformType = 'pc' | 'mobile'

/** seed 类型 */
export type WorkflowType = 'webpack' | 'gulp-requirejs' | 'other'

/** seed 二级类型, 当 workflow = webpack 时适用 */
export type SeedType = 'react-ts' | 'vue2' | 'vue2-ts' | 'base'

/** 日志等级 */
export type LogLevel = 1 | 2 | 0

/** 映射 map 类型 */
export interface AddressMap {
  [address: string]: string
}

/** concat 配置 */
export interface ConcatConfig {
  [dist: string]: string[]
}

/** copy 配置 */
export interface ResourceConfig {
  [src: string]: string
}

/** 反向代理相关配置 */
export interface ProxyConfig {
  /** 代理端口 */
  port?: number
  /** 映射表 */
  localRemote?: AddressMap
  /** 是否执行 https */
  https?: boolean
  /** 主页 */
  homePage?: string
  /** 跳过规则 */
  ignores?: string[]
  /** ui 界面端口 */
  webPort?: number
}

/** 本地服务运行入口 函数 入参 */
export interface LocalserverEntryFnProps {
  env: Env
}

/** 本地服务运行入口 函数 */
export type LocalserverEntryFn = (props: LocalserverEntryFnProps) => Express

/** 本地服务运行入口 */
export type LocalserverEntry = string | LocalserverEntryFn

/** 本地服务相关配置 */
export interface LocalserverConfig {
  /** 端口 */
  port?: number
  /** 映射目录 */
  root?: string
  /** 热更新 port */
  lrPort?: number
  /** 是否执行livereload */
  livereload?: boolean
  /** 服务地址 */
  serverAddress?: string
  /** mock 根目录 */
  mockRoot?: string
  /** 本地服务运行入口 - 替代 localserver */
  entry?: LocalserverEntry
  /** 需要进行反向代理的远程路径 yyl 4.0 以上支持 */
  proxies?: string[]
}

/** 输出目录相关配置 */
export interface DestConfig {
  /** 输出基础路径 */
  basePath: string
  /** js 输出路径(基于基础路径) */
  jsPath: string
  /** jslib 输出路径(基于基础路径) */
  jslibPath?: string
  /** css 输出路径(基于基础路径) */
  cssPath: string
  /** html 输出路径(基于基础路径) */
  htmlPath: string
  /** images 输出路径(基于基础路径) */
  imagesPath: string
  /** tpl 输出路径(基于基础路径) */
  tplPath?: string
  /** rev 输出路径(基于基础路径) */
  revPath: string
}

/** 打包相关配置 */
export interface CommitConfig {
  /** rev-manifest 线上地址配置 */
  revAddr: string
  /** 输出 hostname 配置 */
  hostname: string
  /** 静态资源域名，若没有则会取 hostname */
  staticHost?: string
  /** html域名，若没有则会取 hostname */
  mainHost?: string
}

/** yyl cli 传入 env */
export interface Env {
  // + 基础配置
  /** 配置名称 */
  name?: string
  /** 开发内部使用 */
  workflow?: WorkflowType
  /** yyl.conig 路径 */
  config?: string
  /** 开启打包模式 */
  isCommit?: boolean
  /** 开启静默模式 */
  silent?: boolean
  /** 日志等级 */
  logLevel?: LogLevel
  // - 基础配置

  // + yyl-server 相关配置
  /** 代理根目录 server cli 适用 */
  path?: string
  /** 开启线上映射模式 */
  remote?: boolean
  /** 本地代理端口 */
  port?: number
  /** 开启反向映射模式 */
  proxy?: boolean | number
  /** 开启 https 代理 */
  https?: boolean
  /** 已由 --remote 代替，不建议使用 */
  ver?: 'remote'

  /** 参数配置 */
  NODE_ENV?: 'string'
  // - yyl-server 相关配置

  // + yyl-seed-webpack 配置
  /** 二级 seed 名称 */
  seed?: SeedType
  /** 是否写入 dist (适用于 webpack) */
  writeToDisk?: boolean
  /** 显示代理 toast (适用于 webpack) */
  tips?: boolean
  /** 启动刷新更新 (适用于 webpack) */
  livereload?: boolean
  /** 启动热更新 (适用于 webpack) */
  hmr?: boolean
  // - yyl-seed-webpack 配置
  /** 使用 hot plugin */
  useHotPlugin?: boolean

  /** 自定义变量 */
  [key: string]: any
}

export type ScriptsFn = ({ env: Env, config: YylConfig }) => Promise<unknown>
export type ScriptsHandler = string | ScriptsFn

export interface YylConfigAlias {
  /** 输出路径 */
  root: string
  /** 根目录 */
  dirname: string
  /** js输出路径 */
  jsDest: string
  /** src 路径 */
  srcRoot: string
  /** css 输出路径 */
  cssDest: string
  /** html 输出路径 */
  htmlDest: string
  /** images 输出路径 */
  imagesDest: string
  /** rev-manifest 输出路径 */
  revDest: string
  /** rev-manifest 输出的根目录路径 */
  revRoot: string
  /** 其他 */
  [name: string]: string
}

/** yyl 配置 */
export interface YylConfig {
  /** 项目名称 */
  name?: string
  /** seed 包名称 */
  workflow?: WorkflowType
  /** yyl 版本 */
  version?: string
  /** 平台 */
  platform?: PlatformType
  /** 代理配置 */
  proxy?: ProxyConfig
  /** 本地服务配置 */
  localserver?: LocalserverConfig
  /** 是否使用 yarn */
  yarn?: boolean
  /** 输出配置 */
  dest?: DestConfig
  /** 打包配置 */
  commit?: CommitConfig
  /** 合并配置 */
  concat?: ConcatConfig
  /** copy配置 */
  resource?: ResourceConfig
  /** 插件配置(不建议使用) */
  plugins?: string[]
  /** webpack 文件路径配置 */
  webpackConfigPath?: string
  /** webpack.resolve.alias 配置 */
  alias?: YylConfigAlias
  /** all 相关配置 */
  all?: {
    /** 配置构建执行前运行脚本 */
    beforeScripts?: ScriptsHandler
    /** 配置构建执行前运行脚本 */
    afterScripts?: ScriptsHandler
  }
  /** watch 相关配置 */
  watch?: {
    /** 配置构建执行前运行脚本 */
    beforeScripts?: ScriptsHandler
    /** 配置构建执行前运行脚本 */
    afterScripts?: ScriptsHandler
  }

  /** seed sub name (适用于 webpack) */
  seed?: SeedType
  /** 是否自动 px 转 rem (适用于 webpack) */
  px2rem?: boolean
  /** 补充 webpack.resolveModule 路径 (适用于 webpack) */
  resolveModule?: string
  /** 配置加入 babel 的插件 (适用于 webpack) */
  babelLoaderIncludes?: string[]
  /** url-loader limit值配置 (适用于 webpack) */
  base64Limit?: number
  /** url-loader 命中 test 追加 */
  urlLoaderMatch?: RegExp
}

/** yyl.config.js 返回对象 - 函数 props */
export interface YylConfigEntryProps {
  env: Env
  [key: string]: any
}

/** yyl.config.js 返回对象 - 函数 */
export type YylConfigEntryFn = (props: YylConfigEntryProps) => YylConfig

/** yyl.config.js 返回对象 */
export type YylConfigEntry = YylConfig | YylConfigEntryFn
