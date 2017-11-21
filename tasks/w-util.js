'use strict';
var 
    util = require('yyl-util'),
    os = require('os'),
    USERPROFILE = process.env[process.platform == 'win32'? 'USERPROFILE': 'HOME'];

util.vars = {
    IS_WINDOWS: process.platform == 'win32',

    // svn rev 文件保留多少个版本
    REV_KEEP_COUNT: 3,
    // 当前cmd 所在地址
    PROJECT_PATH: util.joinFormat(process.cwd()),

    // 搜索用 common 目录路径匹配
    COMMIN_PATH_LIKE: 'public/global',
    // COMMIN_PATH_LIKE: 'common/pc',

    // 用户设置文件地址
    USER_CONFIG_FILE: util.joinFormat(process.cwd(), 'config.js'),

    // 用户 package.json 地址
    USER_PKG_FILE: util.joinFormat(process.cwd(), 'package.json'),

    // 本程序根目录
    BASE_PATH: util.joinFormat(__dirname, '../..'),

    // server 根目录
    SERVER_PATH: util.joinFormat(USERPROFILE, '.yyl'),

    // server 工作流目录
    SERVER_WORKFLOW_PATH: util.joinFormat(USERPROFILE, '.yyl/init-files'),
    // server lib 目录
    SERVER_LIB_PATH: util.joinFormat(USERPROFILE, '.yyl/lib'),

    // server 数据存放目录
    SERVER_DATA_PATH: util.joinFormat(USERPROFILE, '.yyl/data'),

    // 本机 ip地址
    LOCAL_SERVER: (function(){
        var ipObj = os.networkInterfaces(),
            ipArr;
        for(var key in ipObj){
            if(ipObj.hasOwnProperty(key)){
                ipArr = ipObj[key];
                for(var fip, i = 0, len = ipArr.length; i < len; i++){
                    fip = ipArr[i];
                    if(fip.family.toLowerCase() == 'ipv4' && !fip.internal){
                        return fip.address;
                    }
                }
            }
        }
        return '127.0.0.1';
    })()
};

util.msg.init({
    maxSize: 8,
    type: {
        update: {name: 'Updated', color: 'cyan'}
    }
});

util.livereload = function(){
    var reloadPath = 'http://' + util.vars.LOCAL_SERVER + ':35729/changed?files=1';
    util.get(reloadPath);
};
util.initConfig = function(config){
    var 
        ctxRender = function(ctx, vars){
            vars = vars || {};
            ctx = util.joinFormat(ctx.replace(/\{\$(\w+)\}/g, function(str, $1){
                return vars[$1] || '';
            }));
            return ctx;
        },
        iForEach = function(arr, vars){
            for(var i = 0, len = arr.length; i < len; i++){
                switch(util.type(arr[i])){
                    case 'array':
                        arr[i] = iForEach(arr[i], vars);
                        break;

                    case 'string':
                        arr[i] = ctxRender(arr[i], vars);
                        break;

                    case 'object':
                        if(arr[i] !== null){
                            arr[i] = deep(arr[i], vars);
                        }
                        break;
                    case 'function':
                        break;

                    default:
                        break;
                }
            }
            return arr;
        },
        deep = function(obj, vars){
            var newKey;
            for(var key in obj){
                if(obj.hasOwnProperty(key)){
                    switch(util.type(obj[key])){
                        case 'array':
                            newKey = ctxRender(key, vars);
                            if(newKey != key){
                                obj[newKey] = iForEach(obj[key], vars);
                                delete obj[key];

                            } else {
                                obj[key] = iForEach(obj[key], vars);
                            }
                            break;

                        case 'object':
                            newKey = ctxRender(key, vars);
                            if(newKey != key){
                                obj[newKey] = deep(obj[key], vars);
                                delete obj[key];

                            } else {
                                obj[key] = deep(obj[key], vars);

                            }
                            break;

                        case 'string':
                            obj[key] = ctxRender(obj[key], vars);
                            break;

                        case 'function':
                            break;

                        default:
                            break;
                    }
                }
            }
            return obj;

        };

    // 判断是单个 config 还是 多项目 config
    var useful = false; 
    if(!config.alias && !config.localserver){
        for(var key in config){
            if(util.type(config[key]) == 'object' && config[key].alias && config[key].localserver){
                config[key] = deep(config[key], config[key].alias);
                useful = true;
            }
        }
    } else if(config.alias && config.localserver){
        config = deep(config, config.alias);
        useful = true;
    }


    if(!useful){
        util.msg.error('useness config file', 'please check');
        process.exit();
    }
    return config;

};

module.exports = util;
