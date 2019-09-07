const LANG = {
  logKeyword: {
    '完成': 'green',
    '结束': 'green',
    '打开': 'yellow',
    '开始': 'cyan'
  },

  CMD: {
    HELP: {
      COMMANDS: {
        INIT: '初始化',
        INFO: '打印项目基本信息',
        SERVER: '服务器相关命令',
        MAKE: '组件生成(适用于部分 yyl 项目)'
      },
      OPTIONS: {
        HELP: '显示帮助信息',
        VERSION: '显示版本',
        PATH: '显示 yyl 所在路径',
        LOG_LEVEL: '设置 logLevel: 0|1|2',
        CONFIG: '设置 yyl 配置路径'
      }
    },
    TASK_START: '命令执行开始',
    TASK_FINSHED: '命令执行完成'
  },
  INFO: {
    DETAIL: {
      NAME: '项目名称',
      WORKFLOW: '技术栈',
      BUILD_VERSION: '创建时yyl版本',
      PLATFORM: '开发场景',
      PROXY: '代理信息'
    },
    READ_ERROR: '基本信息读取失败, 设置不符合规范'
  },
  INIT: {
    QUESTION: {
      NAME: '项目名称',
      PLATFORM: '开发场景',
      WORKFLOW: '技术栈',
      WORKFLOW_SEED: '技术栈初始 seed 包',
      CONFIRM: '项目信息确认',
      COMMIT_TYPE: '发布类型',
      YYL_VERSION: 'yyl 版本'
    },
    HELP: {
      HELP: '显示帮助信息',
      NAME: '项目名称设置',
      PLATFORM: '项目使用场景设置',
      WORKFLOW: '项目技术栈设置',
      INIT: '项目技术栈初始 seed 配置',
      CWD: '初始化的目标路径配置',
      NO_NPM: '初始化结束后不执行 npm install 初始化'
    },
    START: '项目初始化开始',
    FINISHED: '项目初始化完成',

    CONFIG_NOT_EXISTS: '配置文件路径不存在',

    OPEN_PATH: '打开路径',

    SEED_INIT_START: 'seed 初始化开始',
    SEED_INIT_FINISHED: 'seed 初始化完成',

    NPM_INSTALL_START: '正在运行 npm install 安装项目依赖',
    NPM_INSTALL_FINISHED: '安装依赖完成',

    PLATFORM_PC_START: 'pc 部分初始化开始',
    PLATFORM_PC_FINISHED: 'pc 部分初始化完成',
    PLATFORM_MOBILE_START: 'mobile 部分初始化开始',
    PLATFORM_MOBILE_FINISHED: 'mobile 部分初始化完成',
    FILE_FORMAT_START: '正在格式化文件',
    FILE_FORMAT_FINISHED: '格式化文件完成'
  }, MAKE: {
    PARSE_CONFIG_FINISHED: '解析配置完成',
    WORKFLOW_NOT_FOUND: '运行失败, 配置中的技术栈<config.workflow>不存在',
    WORKFLOW_MAKE_NOT_SET: '运行失败, 当前技术栈没有设置 make 方法'
  },
  OPTIMIZE: {
    PARSE_CONFIG_START: '解析配置开始',
    PARSE_CONFIG_ERROR: '解析配置发生错误',
    REQUIRE_ATLEAST_VERSION: '构建失败, 项目要求 yyl 版本 不能低于',
    WORKFLOW_NOT_FOUND: '构建失败, 技术栈配置<config.workflow> 不存在',
    WORKFLOW_OPTI_HANDLE_NOT_EXISTS: '构建失败, 当前技术栈 workflow.optimize 返回值 不能操作',
    PLUGINS_INSTALL_FAIL: '构建失败，初始化项目 plugins 出错',
    TASK_RUN_FAIL: '任务运行失败',
    TASK_RUN_FINISHED: '任务运行完成',
    PAGE_RELOAD: '页面刷新',
    RESOURCE_UPDATE: '资源<config.resource>同步'
  },
  REMOVE: {
    PATH_NOT_FOUND: '目标路径不存在',
    FILE_NAME_WITH_SPACE_ERROR: '文件删除失败, 文件路径中带有空格',
    PATH_CLEANING: '正在删除路径',
    CLEAN_FINISHED: '删除路径完成',
    RUN_CMD: '运行命令行'
  },
  SEED: {
    LOADING: '正在加载模块',
    PLEASE_WAIT: '请稍等',
    PARSE_CONFIG_ERROR: '解析配置错误'
  },
  SERVER: {
    HELP: {
      COMMANDS: {
        START: '服务器启动',
        ABORT: '服务器关闭',
        CLEAR: 'yyl server 配置项清空'
      },
      OPTIONS: {
        PROXY: '激活反向代理服务',
        HELP: '显示帮助信息',
        PATH: '打开 yyl server 配置所在路径'
      }

    },
    USE_DEFAULT_CONFIG: '使用默认配置',
    CLEAN_START: '正在清除 yyl server 配置项...',
    CLEAN_FINISHED: '清除 配置项完成',
    CHANGE_LOG_LEVEL: '切换 logLevel'

  }
};

module.exports = LANG;