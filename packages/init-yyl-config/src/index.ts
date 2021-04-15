import path from 'path'
import {
  YylConfig,
  Env,
  YylConfigEntry,
  DestConfig,
  LocalserverConfig,
  ProxyConfig,
  CommitConfig
} from 'yyl-config-types'

export interface InitYylConfigMergeProps {
  /** yylconfig */
  yylConfig: YylConfig
  /** env */
  env: Env
}
/** 更改 yylConfig 操作函数 */
export type InitYylConfigMerge = (props: InitYylConfigMergeProps) => YylConfig

/** 项目信息 */
export interface ProjectInfo {
  /** 项目名称 */
  name: Required<YylConfig>['name']
  /** seed 类型 */
  workflow?: Required<YylConfig>['workflow']
  /** seed 二级类型 */
  seed?: Required<YylConfig>['seed']
  /** 开发平台 */
  platform?: Required<YylConfig>['platform']
  /** 要求 yyl 最低版本 */
  yylVersion?: Required<YylConfig>['version']
  /** 项目源文件目录 */
  srcRoot?: string
  /** 是否使用 yarn */
  yarn?: YylConfig['yarn']
}

export interface InitYylConfigOption {
  /** 项目信息 */
  projectInfo: ProjectInfo
  /** 输出配置 */
  dest?: DestConfig
  /** 本地服务配置 */
  localserver?: LocalserverConfig
  /** 反向代理配置 */
  proxy?: ProxyConfig
  /** 发布配置 */
  commit?: {
    revAddr?: string
    hostname?: string
  }
  /** yyl 配置变更 */
  merge?: InitYylConfigMerge
}

/** 默认项目配置 */
export const DEFAULT_PROJECT_INFO: Required<ProjectInfo> = {
  /** 项目名称 */
  name: '',
  /** seed 类型 */
  workflow: 'webpack',
  /** 平台类型 */
  platform: 'pc',
  /** yyl 版本 */
  yylVersion: '',
  /** src 路径 */
  srcRoot: './src',
  /** 是否使用 yarn */
  yarn: true,
  seed: 'base'
}

/** 默认服务器配置 */
export const DEFAULR_LOCAL_SEVER_CONFIG: LocalserverConfig = {
  /** server映射路径 */
  root: './dist',
  /** 端口 */
  port: 5000
}

/** 默认反向代理配置 */
export const DEFAULT_PROXY_CONFIG: ProxyConfig = {
  /** 端口 */
  port: 8887,
  /** 映射 map */
  localRemote: {}
}

/** 默认 输出 配置 */
export const DEFAULT_DEST_CONFIG: DestConfig = {
  basePath: '/',
  jsPath: 'js',
  cssPath: 'css',
  htmlPath: 'html',
  imagesPath: 'image',
  revPath: 'assets'
}

export const DEFAULT_COMMIT: CommitConfig = {
  revAddr: '',
  hostname: '/'
}

/** 初始化 yyl.config */
export function initYylConfig(option: InitYylConfigOption): YylConfigEntry {
  const { merge } = option
  const projectInfo: Required<ProjectInfo> = {
    ...DEFAULT_PROJECT_INFO,
    ...option.projectInfo
  }

  const localserver = {
    ...DEFAULR_LOCAL_SEVER_CONFIG,
    ...option.localserver
  }

  const proxy = {
    ...DEFAULT_PROXY_CONFIG,
    ...option.proxy
  }

  const dest = {
    ...DEFAULT_DEST_CONFIG,
    ...option.dest
  }

  const commit = {
    ...DEFAULT_COMMIT,
    ...option.commit
  }

  const DEST_BASE_PATH = path.join(localserver.root || process.cwd(), dest.basePath as string)

  const makeYylConfig: YylConfigEntry = ({ env }) => {
    const yylConfig: YylConfig = {
      name: projectInfo.name,
      workflow: projectInfo.workflow,
      version: projectInfo.yylVersion,
      seed: projectInfo.seed,
      platform: projectInfo.platform,
      px2rem: projectInfo.platform === 'mobile',
      base64Limit: 3000,
      localserver,
      proxy,
      dest,
      alias: {
        /** 输出目录中 到 html, js, css, image 层 的路径 */
        root: DEST_BASE_PATH,
        /** rev 输出内容的相对地址 */
        revRoot: DEST_BASE_PATH,
        /** dest 地址 */
        destRoot: localserver?.root as string,
        /** src 地址 */
        srcRoot: projectInfo.srcRoot,
        /** 项目根目录 */
        dirname: './',
        /** js 输出地址 */
        jsDest: path.join(DEST_BASE_PATH, dest?.jsPath as string),
        /** html 输出地址 */
        htmlDest: path.join(DEST_BASE_PATH, dest?.htmlPath as string),
        /** css 输出地址 */
        cssDest: path.join(DEST_BASE_PATH, dest?.cssPath as string),
        /** images 输出地址 */
        imagesDest: path.join(DEST_BASE_PATH, dest?.imagesPath as string),
        /** rev-manifest 输出地址 */
        revDest: path.join(DEST_BASE_PATH, dest?.revPath as string),
        basePath: dest?.basePath as string,
        publicPath: commit.hostname
      },
      commit
    }
    if (merge) {
      return merge({
        yylConfig,
        env
      })
    } else {
      return yylConfig
    }
  }

  return makeYylConfig
}
