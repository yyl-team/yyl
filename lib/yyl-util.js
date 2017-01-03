'use strict';
var 
    color = require('./colors'),
    fs = require('fs'),
    os = require('os'),
    http = require('http'),
    path = require('path');

var 
    util = {

        livereload: function(){
            var reloadPath = 'http://' + util.vars.LOCAL_SERVER + ':35729/changed?files=1';
            util.get(reloadPath);
        },
        initConfig: function(config){
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

        },
        readdirSync: function(iPath, filter){
            var 
                files = fs.readdirSync(iPath),
                r = [];

            if(filter){
                files.forEach(function(str){
                    if(!str.match(filter)){
                        r.push(str);
                    }
                });

                return r;

            } else {
                return files;
            }

        },
        envStringify: function(obj){
            var r = [];
            for(var key in obj){
                if(obj.hasOwnProperty(key)){
                    r.push('--' + key);
                    r.push(obj[key]);
                }
            }
            return r.join(' ');
        },
        envPrase: function(argv){
            var iArgv = util.makeArray(argv);
            var r = {};
            var reg = /^--(\w+)/;

            for(var i = 0, key, nextKey, len = iArgv.length; i < len; i++){
                key = iArgv[i];
                nextKey = iArgv[i + 1];
                if(key.match(reg) && i <= len - 1){
                    if(i >= len - 1){
                        r[key.replace(reg, '$1')] = true;

                    } else {
                        if(nextKey.match(reg)){
                            r[key.replace(reg, '$1')] = true;

                        } else {
                            r[key.replace(reg, '$1')] = nextKey;
                            i++;
                        }

                    }

                }
            }
            return r;

        },
        openBrowser: function(address){
            if(util.vars.IS_WINDOWS){
                util.runCMD('start ' + address);

            } else {
                util.runCMD('open ' + address);

            }
        },

        /**
         * 目录输出
         */
        buildTree: function(op){
            var 
                options = {
                    // 当前目录
                    path: '',
                    // 虚拟目录列表
                    dirList: [],
                    // 目录前缀
                    frontPath: '',
                    // 目录树前置空格数目
                    frontSpace: 2,
                    // 目录过滤
                    dirFilter: null,
                    // 不展开的文件夹列表
                    dirNoDeep: []
                },
                o = util.extend(options, op),
                deep = function(iPath, parentStr){
                    var 
                        list = readdirSync(iPath),
                        space = '',
                        iParentStr;


                    if(!list.length){
                        return;
                    }
                    iParentStr = parentStr.replace(/^(\s*)[a-zA-Z0-9._-]+/, '$1');
                    space = iParentStr.split(/[-~]/)[0];
                    // space = parentStr.replace(/(\s*\|)[-~]/, '$1');
                    space = space.replace('`', ' ');

                    if(/\w/ig.test(iParentStr)){
                        space += '  ';
                    }

                    list.sort(function(a, b){
                        var 
                            makeIndex = function(str){
                                if(/^\./.test(str)){
                                    return 1;

                                } else if(~str.indexOf('.')){
                                    return 2;

                                } else {
                                    return 3;
                                }
                            },
                            aIdx = makeIndex(a),
                            bIdx = makeIndex(b);

                        if(aIdx == bIdx){
                            return a.localeCompare(b);

                        } else {
                            return bIdx - aIdx;
                        }


                    });

                    list.forEach(function(filename, i){
                        if(o.dirFilter && filename.match(o.dirFilter)){
                            return;
                        }
                        var 
                            isDir = isDirectory(util.joinFormat(iPath, filename)),
                            noDeep = ~o.dirNoDeep.indexOf(filename),
                            l1, l2,
                            rStr = '';

                        if(i == list.length - 1){
                            l1 = '`';

                        } else {
                            l1 = '|';
                        }

                        if(isDir){
                            if(noDeep){
                                l2 = '+';

                            } else {
                                l2 = '~';
                            }

                        } else {
                            l2 = '-';

                        }
                        l1 = color.gray(l1);
                        l2 = color.gray(l2);
                        rStr = space + l1 + l2 + ' ' + filename;

                        r.push(rStr);

                        if(isDir && !noDeep){
                            deep(util.joinFormat(iPath, filename), rStr);
                        }

                    });

                },
                r = [],
                i = 0,
                len,
                space = '',
                readdirSync,
                isDirectory;

            if(o.dirList.length){ // 虚拟的
                // 处理下数据
                for(i = 0, len = o.dirList.length; i < len; i++){
                    o.dirList[i] = util.joinFormat(o.dirList[i].replace(/[\/\\]$|^[\/\\]/, ''));
                }
                if(o.path){
                    o.path = util.joinFormat(o.path);
                }

                readdirSync = function(iPath){
                    var r = [];
                    if(o.path === '' && o.path == iPath){
                        o.dirList.forEach(function(oPath){
                            var filename;
                            filename = oPath.split('/').shift();
                            if(filename){
                                r.push(filename);
                            }
                        });

                    } else {
                        o.dirList.forEach(function(oPath){

                            var filename;
                            if(oPath != iPath && oPath.substr(0, iPath.length) == iPath){
                                filename = oPath.substr(iPath.length + 1).split('/').shift();
                                if(filename){
                                    r.push(filename);
                                }

                            }
                        });

                    }


                    // 排重
                    if(r.length > 1){
                        r = Array.from(new Set(r));
                    }

                    return r;

                };
                isDirectory = function(iPath){
                    var r = false;
                    for(var i = 0, len = o.dirList.length; i < len; i++){
                        if(o.dirList[i].substr(0, iPath.length) == iPath && o.dirList[i].length > iPath.length){
                            r = true;
                            break;
                        }

                    }
                    return r;

                };

            } else { // 真实的
                readdirSync = function(iPath){
                    var list = [];

                    if(!fs.existsSync(iPath) || !fs.statSync(iPath).isDirectory()){
                        return list;
                    }

                    try{
                        list = fs.readdirSync(iPath);
                    } catch(er){}

                    return list;
                };

                isDirectory = function(iPath){
                    if(!fs.existsSync(iPath)){
                        return false;
                    }
                    return fs.statSync(iPath).isDirectory();

                };
            }


            for(i = 0; i < o.frontSpace; i++){
                space += ' ';
            }


            if(o.frontPath){
                var list = o.frontPath.split(/[\\\/]/);
                list.forEach(function(str, i){
                    var l1, l2;
                    if(i === 0){
                        l1 = '';
                        l2 = '';

                    } else {
                        l1 = '`';
                        l2 = '~ ';
                    }

                    if(l1){
                        l1 = color.gray(l1);
                    }
                    if(l2){
                        l2 = color.gray(l2);
                    }

                    r.push(space + l1 + l2 + str);
                    if(i > 0){
                        space += '   ';
                    }
                });
            } else if(o.path) {
                var iName = o.path.split(/[\\\/]/).pop();
                r.push(space + iName);

            }

            deep(o.path, r.length && o.frontPath? r[r.length - 1]: space);

            // 加点空格
            r.unshift('');
            r.push('');
            console.log(r.join('\n'));
        },
        /**
         * 文件名搜索
         */
        findPathSync: function(iPath, root, filter, ignoreHide){
            var 
                iRoot = root || path.parse(__dirname).root,
                r = [];

            (function deep(fPath){
                if(!fs.existsSync(fPath)){
                    return;
                }

                var list;

                try{
                    list = fs.readdirSync(fPath);
                } catch(er){
                    return;
                }

                list.forEach(function(str){
                    if(ignoreHide){
                        if(/^\./.test(str)){
                            return;
                        }
                    }
                    var wPath = util.joinFormat(fPath, str);
                    util.msg.replace(color.yellow('[info] searching:' + wPath));
                    if(~wPath.indexOf(iPath)){
                        util.msg.newline().success('find path:', wPath);
                        r.push(wPath);

                    } else {
                        if((filter && !wPath.match(filter)) || !filter){
                            if(fs.existsSync(wPath) && fs.statSync(wPath).isDirectory()){
                                deep(wPath);
                            }
                        }

                    }

                });

            })(iRoot);

            return r;


        },

        /**
         * 获取 js 内容
         */
        requireJs: function(iPath){
            if(fs.existsSync(iPath)){
                if(path.isAbsolute(iPath)){
                    try {
                        return require(iPath);
                    } catch(er){
                        return;
                    }
                } else {
                    if(/^([\/\\]|[^:\/\\]+[\/\\.])/.test(iPath)){
                        try {
                            return require(util.joinFormat('./', iPath));
                        } catch(er){
                            return {};
                        }
                    } else {
                        try {
                            return require(iPath);
                        } catch(er){
                            return;
                        }
                    }

                }

            } else {
                return;
            }
        },
        /**
         * 创建文件夹(路径上所有的 文件夹 都会创建)
         */
        mkdirSync: function(toFile){
            (function deep(iPath){
                if(fs.existsSync(iPath) || /[\/\\]$/.test(iPath)){
                    return;

                } else {
                    deep(path.dirname(iPath));
                    fs.mkdirSync(iPath);
                }

            })(toFile);

        },
        /**
         * 创建 YYYYMMDDmmss 格式时间搓
         */
        makeCssJsDate: function(){
            var 
                now = new Date(),
                addZero = function(num) {
                    return num < 10 ? '0' + num : '' + num; };
            return now.getFullYear() +
                addZero(now.getMonth() + 1) +
                addZero(now.getDate()) +
                addZero(now.getHours()) +
                addZero(now.getMinutes()) +
                addZero(now.getSeconds());
        },
        /**
         * 打开文件所在位置
         */
        openPath: function(iPath){
            if(util.vars.IS_WINDOWS){
                // util.runCMD('explorer /select, '+ iPath.replace(/\//g,'\\'), undefined, __dirname, false);
                util.runCMD('start '+ iPath.replace(/\//g,'\\'), undefined, __dirname, false);

            } else {
                util.runCMD('open ' + iPath);
            }

        },
        
        /**
         * 路径转换
         * 参数同 path.join
         */
        joinFormat: function(){
            var iArgv = Array.prototype.slice.call(arguments);
            var r = path.join.apply(path, iArgv);

            if(/^\.[\\\/]/.test(iArgv[0])){
                r = './' + r;
            }
            return r
                .replace(/\\+/g, '/')
                .replace(/(^http[s]?:)[\/]+/g, '$1//');

        },
        /**
         * 运行 cmd
         * @param  {String|Array} str             cmd执行语句 or 数组
         * @param  {funciton}     callback(error) 回调函数
         *                        - error         错误信息
         * @return {Void}
         */
        runCMD: function(str, callback, path, showOutput){

            var myCmd = require('child_process').exec,
                child;
            if(showOutput === undefined){
                showOutput = true;
            }
            if (!str) {
                return callback('没任何 cmd 操作');
            }
            if (!/Array/.test(Object.prototype.toString.call(str))) {
                str = [str];
            }

            child = myCmd(str.join(" && "),{
                maxBuffer: 2000 * 1024,
                cwd: path || ''
            }, function(err){
                if(err){
                    if(showOutput){
                        console.log('cmd运行 出错');
                        console.log(err.stack);
                    }
                    return callback && callback('cmd运行 出错');
                } else {

                    return callback && callback();
                }

            });
            child.stdout.setEncoding('utf8');

            if(showOutput){
                child.stdout.pipe(process.stdout);
                child.stderr.pipe(process.stderr);
            }

        },
        /**
         * 运行 单行 cmd
         * @param  {String}       str             cmd执行语句 or 数组
         * @param  {funciton}     callback(error) 回调函数
         *                        - error         错误信息
         * @return {Void}
         */
        runSpawn: function(ctx, done, iPath, showOutput){
            var 
                iSpawn = require('child_process').spawn,
                ops = ctx.split(/\s+/),
                hand = ops.shift(),
                cwd = iPath || process.cwd(),
                child;

            process.chdir(cwd);

            child = iSpawn(hand, ops, {
                cwd: cwd,
                silent: showOutput? true: false,
                stdio: [0,1,2]
            });
            child.on('exit', function(err){
                process.chdir(util.vars.PROJECT_PATH);
                return done && done(err);
            });
        },
        /**
         * 删除文本
         * ------------
         * 单个文本方法
         * -------------
         * @param  {String}   path
         * @param  {function} callback
         * @param  {RegExp}   filters
         *
         * --------------
         * 多个目录/文件方法
         * --------------
         * @param  {Array}    list
         * @param  {function} callback 回调方法
         * @param  {RegExp}   filters  忽略文件用 滤镜，选填参数
         *
         * @return {Void}
         */
        removeFiles: function(list, callback, filters){
            if(util.type(list) != 'array'){
                list = [list];
            }

            var rmFile = function(file, filters){
                    if(!fs.existsSync(file) || (filters && filters.test(file))){
                        return;
                    }
                    try{
                        fs.unlinkSync(file);
                    } catch(er){}

                },
                rmPath = function(iPath, filters){
                    var list = fs.readdirSync(iPath);

                    list.forEach(function(item){
                        var file = path.join(iPath, item);
                       
                        if(filters && filters.test(file)){

                        } else {
                            var stat = fs.statSync(file);
                                
                            if(stat.isDirectory()){
                                rmPath(file, filters);
                                try{
                                    fs.rmdirSync(file);
                                } catch(er){}

                            } else {
                                rmFile(file);
                            }
                        }
                    });
                };

            list.forEach(function(item){
                if(!item || !fs.existsSync(item)){
                    return;
                }

                var stat = fs.statSync(item);
                if(stat.isDirectory()){
                    rmPath(item, filters);
                } else {
                    rmFile(item, filters);
                }
                
            });
            if(callback){
                callback();
            }
        },
        Promise: function(fn){
            var she = this;
            
            she.queue = [];
            she.current = 0;
            she.then = function(fn){
                if(typeof fn == 'function'){
                    she.queue.push(fn);
                }
                return she;
            };
            she.start = function(){
                var myArgv = Array.prototype.slice.call(arguments);
                she.resolve.apply(she, myArgv);
            };

            she.resolve = function(){
                var myArgv = Array.prototype.slice.call(arguments);
                
                myArgv.push(she.resolve);
                if(she.current){
                    myArgv.push(she.queue[she.current - 1]);
                }

                if(she.current != she.queue.length){
                    she.queue[she.current++].apply(she, myArgv);
                }
            };
            if(fn){
                she.then(fn);
            }

        },

        readFilesSync: function(iPath, filter){
            var 
                r = [],
                deep = function(rPath){
                    if(!fs.existsSync(rPath)){
                        return;
                    }

                    var list = fs.readdirSync(rPath);

                    list.forEach(function(str){
                        var mPath = util.joinFormat(rPath, str);
                        if(fs.statSync(mPath).isDirectory()){
                            deep(mPath);

                        } else {
                            if(filter){
                                if(mPath.match(filter)){
                                    r.push(mPath);
                                }
                            } else {
                                r.push(mPath);
                            }
                        }
                    });

                };

            deep(iPath);
            return r;

        },
        /**
         * 拷贝文本
         * ------------
         * 单个文本方法
         * -------------
         * @param  {String}   path
         * @param  {String}   toPath
         * @param  {function} callback
         * @param  {RegExp}   filters
         * @param  {function} render
         *
         * --------------
         * 多个目录/文件方法
         * --------------
         * @param  {Object}   list
         * @param  {function} callback 回调方法
         * @param  {RegExp}   filters  忽略文件用 滤镜，选填参数
         * @param  {function} render   文本渲染用方法
         *                             - @param {String}  filename 文件名称
         *                             - @param {String}  content  文件内容
         *                             - @return {String} content  过滤后的文本内容
         * @return {Void}
         */
        copyFiles: function(list, callback, filters, render, basePath){///{
            // 传入参数初始化
            if(typeof arguments[0] == 'string' && typeof arguments[1] == 'string'){
                var flist = {};
                flist[arguments[0]] = arguments[1];
                list = flist;
                callback = arguments[2];
                filters = arguments[3];
                render = arguments[4];
                basePath = arguments[5];
            }
            
            if(typeof filters == 'function'){
                render = filters;
                filters = undefined;
            }

            if(!render){
                render = function(filename, content){
                    return content;
                };
            }

            if(typeof list != 'object'){
                util.msg.error('list 参数格式不正确');
                if(callback){
                    callback('list 参数格式不正确');
                }
                return;
            }
            var count = [];
            var fileCopy = function(file, toFile, filters, render, basePath){
                    if(!fs.existsSync(file) || (filters && file.match(filters))){
                        return;
                    }
                    var content = fs.readFileSync(file);
                    // 如果中途文件夹不存在 则创建
                    util.mkdirSync(path.dirname(toFile));

                    fs.writeFileSync(toFile, render(file, content));

                    if(basePath){
                        util.msg.create(util.joinFormat(path.relative(basePath, toFile)));
                    }
                    count.push(toFile);

                    util.timer.mark();
                },
                pathCopy = function(iPath, toPath, done, filters, basePath){
                    if(!fs.existsSync(iPath) || (filters && iPath.match(filters))){
                        done();
                    }
                    


                    fs.readdir(iPath, function(err, list){
                        var padding = list.length;
                            
                        if(!padding){
                            return done();
                        }
                        
                        list.forEach(function(item){
                            if(/^\./.test(item)){
                                if(!--padding){
                                    return done();
                                }
                            }

                            var myFile = iPath + item,
                                targetFile = toPath + item,
                                stat = fs.statSync(myFile);

                            if(filters && myFile.match(filters)){
                                if(!--padding){
                                    return done();
                                }
                            } else if(stat.isDirectory()){
                                if(!fs.existsSync(targetFile)){
                                    util.mkdirSync(path.dirname(targetFile));
                                    if(basePath){
                                        util.msg.create(util.joinFormat(path.relative( basePath, targetFile)));
                                    }
                                    count.push(targetFile);
                                    util.timer.mark();
                                }

                                pathCopy(myFile + '/', targetFile + '/',  function(){
                                    if(!--padding){
                                        return done();
                                    }
                                }, filters, basePath);
                            } else {
                                fileCopy(myFile, targetFile, filters, render, basePath);
                                if(!--padding){
                                    return done();
                                }
                            }
                        });

                    });
                },
                paddingCheck = function(){
                    if(!padding){
                        if(callback){
                            callback(null, count);
                        }
                    }
                },
                padding = 0,
                paddingJian = function(){
                    padding--;
                    paddingCheck();
                };

            padding++;

            var 
                copyit = function(ipath, toPath){
                    if(!fs.existsSync(iPath)){
                        util.msg.warn('copy file is not exist:', iPath);

                    } else {
                        var stat = fs.statSync(iPath);
                        if(util.type(toPath) == 'array'){

                        } else {
                            toPath = [toPath];
                        }

                        toPath.forEach(function(item){
                            if(stat.isDirectory()){
                                padding++;
                                pathCopy(iPath + '/', item + '/', paddingJian, filters, basePath);

                            } else {
                                padding++;
                                fileCopy(iPath, item, filters, render, basePath);
                                paddingJian();

                            }

                        });
                        

                    }


                };
            for(var iPath in list){
                if(list.hasOwnProperty(iPath)){
                    copyit(iPath, list[iPath]);
                }
            }
            paddingJian();
        },
        /**
         * 计时器
         */
        timer: {
            now: undefined,
            total: 0,
            // 点出现的间隔（以文件为单位）
            interval: 5,
            source: [],
            onMark: undefined,
            onEnd: undefined,

            // 计时器 开始
            start: function(o){
                var op = o || {};
                var she = this;
                she.total = 0;
                she.now = new Date();

                if(op.onMark){
                    she.onMark = op.onMark;
                }
                if(op.onEnd){
                    she.onEnd = op.onEnd;
                }
            },

            // 计时器打点记录
            mark: function(ctx){
                var she = this;
                if(!she.now){
                    return;
                }
                she.total++;

                if(ctx){
                    she.source.push(ctx);
                }

                if(she.onMark){
                    she.onMark(ctx);

                } else {
                    if(she.total == 1){
                        util.msg.nowrap(color.green('* '));
                    }

                    if(she.total % she.interval){
                        util.msg.nowrap('.');
                    }
                }

            },
            // 计时器结束
            end: function(){
                var 
                    she = this,
                    r = {
                        time: new Date() - she.now,
                        source: she.source.splice(0)
                    };
                she.now = undefined;
                she.onMark = undefined;
                if(she.onEnd){
                    she.onEnd(r);
                    she.onEnd = undefined;

                } else {
                    util.msg.nowrap(color.green(' ' + r.time + 'ms\n'));
                    return r;
                }
            },

            // 当前时间
            getNow: function(){
                return new Date().toString().replace(/^(\w+\s\w+\s\d+\s\d+\s)(\d+\:\d+\:\d+)(.+)$/,'$2');
            }
        },
        /**
         * 帮助文本输出
         * @param  {Object} op 设置参数
         *                     - ustage   [string] 句柄名称
         *                     - commands [object] 操作方法列表 {key: val} 形式
         *                     - options  [object] 操作方法列表 {key: val} 形式
         * @return {Void}
         */
        help: function(op){
            if(!op){
                return;
            }
            var 
                accountMaxKeyLen = function(arr){
                    var maxLen = 0;
                    for(var key in arr){
                        if(arr.hasOwnProperty(key) && maxLen < key.length){
                             maxLen = key.length;
                        }
                    }
                    return maxLen;
                },
                textIndent = function(txt, num){
                    var r = '';
                    for(var i = 0, len = num; i < len; i++){
                        r += ' ';
                    }
                    return r + txt;
                },
                compose = function(ikey, arr){
                    var r = [],
                        maxkeyLen = accountMaxKeyLen(arr),
                        i, len;
                    
                    r.push('');
                    r.push(color.yellow(textIndent(ikey + ':', baseIndent)));
                    
                    for(var key in arr){
                        if(arr.hasOwnProperty(key)){
                            if(util.type(arr[key]) == 'array'){
                                r.push( color.gray(textIndent(key, baseIndent * 2)) + textIndent(arr[key].shift(), maxkeyLen - key.length + 2));
                                for(i = 0, len = arr[key].length; i < len; i++){
                                    r.push(textIndent(arr[key][i], maxkeyLen + 2 + baseIndent * 2));
                                }



                            } else {
                                r.push(color.gray(textIndent(key, baseIndent * 2)) + textIndent(arr[key], maxkeyLen - key.length + 2));

                            }
                        }
                    }
                    
                    r.push('');
                    return r;
                },
                baseIndent = 2,
                r = [];
                
            if(op.usage){
                r.push(
                    textIndent(color.yellow('Usage: ') + (op.usage || '') +' <command>', baseIndent)
                );
            }
            
            if(op.commands){
                r = r.concat(compose('Commands', op.commands));
            }
            
            if(op.options){
                r = r.concat(compose('Options', op.options));
            }
            
            r.push('');
            r.unshift('');
            
            console.log(r.join('\n'));
        },
        
        /**
         * 文本输出
         */
        msg: {
            replace: function(){
                var 
                    iArgv = util.makeArray(arguments),
                    str = iArgv.join(' ');
                if(str.length > 40){
                    str = str.substr(0, 25) + '...' + str.substr(str.length - 15);
                }
                process.stdout.clearLine();
                process.stdout.cursorTo(0);
                process.stdout.write(str);
            },
            /**
             * 错误输出
             * @param  {String} txt 文本内容
             * @return {Void}
             */
            error: function(){
                var iArgv = util.makeArray(arguments),
                    r = [];
                iArgv.unshift('error  ');
                iArgv.forEach(function(str){
                    if(typeof str != 'string'){
                        r.push(color.red.front);
                        r.push(str);
                        r.push(color.red.back);

                    } else {
                        r.push(color.red(str));
                    }
                });
                this.log.apply(this, r);
            },

            info: function(){
                var iArgv = util.makeArray(arguments),
                    r = [];
                iArgv.unshift('info   ');
                iArgv.forEach(function(str){
                    if(typeof str != 'string'){
                        r.push(color.gray.front);
                        r.push(str);
                        r.push(color.gray.back);

                    } else {
                        r.push(color.gray(str));
                    }
                });
                this.log.apply(this, r);
            },
            del: function(){
                var iArgv = util.makeArray(arguments),
                    r = [];
                iArgv.unshift('delete ');
                iArgv.forEach(function(str){
                    if(typeof str != 'string'){
                        r.push(color.blue.front);
                        r.push(str);
                        r.push(color.blue.back);

                    } else {
                        r.push(color.blue(str));
                    }
                });
                this.log.apply(this, r);
            },
            log: function(){
                var iArgv = util.makeArray(arguments),
                    now = new Date().toString().replace(/^.* (\d+:\d+:\d+).*$/,'$1');

                iArgv.unshift('['+ color.gray(now) +']');
                    
                console.log.apply(console, iArgv);
            },
            /**
             * 成功输出
             * @param  {String} txt 文本内容
             * @return {Void}
             */
            success: function(){
                var iArgv = util.makeArray(arguments),
                    r = [];
                iArgv.unshift('success');
                iArgv.forEach(function(str){
                    if(typeof str != 'string'){
                        r.push(color.cyan.front);
                        r.push(str);
                        r.push(color.cyan.back);

                    } else {
                        r.push(color.cyan(str));
                    }
                });
                this.log.apply(this, r);
            },
            /**
             * 一般输出
             * @param  {String} txt 文本内容
             * @return {Void}
             */
            notice: function(){
                var iArgv = util.makeArray(arguments),
                    r = [];
                iArgv.unshift('notice ');
                iArgv.forEach(function(str){
                    if(typeof str != 'string'){
                        r.push(color.yellow.front);
                        r.push(str);
                        r.push(color.yellow.back);

                    } else {
                        r.push(color.yellow(str));
                    }
                });
                this.log.apply(this, r);
            },
            /**
             * 一般输出
             * @param  {String} txt 文本内容
             * @return {Void}
             */
            warn: function(){
                var iArgv = util.makeArray(arguments),
                    r = [];
                iArgv.unshift('warning');
                iArgv.forEach(function(str){
                    if(typeof str != 'string'){
                        r.push(color.yellow.front);
                        r.push(str);
                        r.push(color.yellow.back);

                    } else {
                        r.push(color.yellow(str));
                    }
                });
                this.log.apply(this, r);
            },
            /**
             * 创造输出
             * @param {String} txt 文本内容
             */
            create: function(){
                var iArgv = util.makeArray(arguments),
                    r = [];
                iArgv.unshift('created');
                iArgv.forEach(function(str){
                    if(typeof str != 'string'){
                        r.push(color.magenta.front);
                        r.push(str);
                        r.push(color.magenta.front);

                    } else {
                        r.push(color.magenta(str));
                    }
                });
                this.log.apply(this, r);
            },
            /**
             * 输出分割线
             * @return {Object} msg
             */
            line: function(){
                console.log('\n' + color.gray('----------------------'));
                return this;
            },
            newline: function(){
                console.log('');
                return this;
            },
            /**
             * 输出不换行的内容
             * @param  {String}  文本内容
             * @param  {Boolean} 是否换新的一行
             * @return {Void}
             */
            nowrap: function(txt, newLine){
                if(newLine){
                    process.stdout.write('\n');
                }
                process.stdout.write(txt);
                return this;
            }
        },
        makeArray: function(obj){
            return Array.prototype.slice.call(obj);
        },
        /**
         * 判断对象类别
         * @param {Anything} 对象
         * @return {string}  类型
         */
        type: function (obj) {
            var type,
                toString = Object.prototype.toString;
            if (obj === null) {
                type = String(obj);
            } else {
                type = toString.call(obj).toLowerCase();
                type = type.substring(8, type.length - 1);
            }
            return type;
        },

        isPlainObject: function (obj) {
            var she = this,
                key,
                hasOwn = Object.prototype.hasOwnProperty;

            if (!obj || she.type(obj) !== 'object') {
                return false;
            }

            if (obj.constructor &&
                !hasOwn.call(obj, 'constructor') &&
                !hasOwn.call(obj.constructor.prototype, 'isPrototypeOf')) {
                return false;
            }

            for (key in obj) {}
            return key === undefined || hasOwn.call(obj, key);
        },

        /**
         * 扩展方法(来自 jQuery)
         * extend([deep,] target, obj1 [, objN])
         * @base she.isPlainObject
         */
        extend: function () {
            var she = this,
                options, name, src, copy, copyIsArray, clone,
                target = arguments[0] || {},
                i = 1,
                length = arguments.length,
                deep = false;

            // Handle a deep copy situation
            if (typeof target === 'boolean') {
                deep = target;
                target = arguments[1] || {};
                // skip the boolean and the target
                i = 2;
            }

            // Handle case when target is a string or something (possible in deep copy)
            if (typeof target !== 'object' && she.type(target) !== 'function') {
                target = {};
            }

            // extend caller itself if only one argument is passed
            if (length === i) {
                target = this;
                --i;
            }

            for (; i<length; i++) {
                // Only deal with non-null/undefined values
                if ((options = arguments[i]) !== null) {
                    // Extend the base object
                    for (name in options) {
                        src = target[name];
                        copy = options[name];

                        // Prevent never-ending loop
                        if (target === copy) {
                            continue;
                        }

                        // Recurse if we're merging plain objects or arrays
                        if (deep && copy && (she.isPlainObject(copy) || (copyIsArray = she.type(copy) === 'array'))) {
                            if (copyIsArray) {
                                copyIsArray = false;
                                clone = src && she.type(src) === 'array' ? src : [];
                            } else {
                                clone = src && she.isPlainObject(src) ? src : {};
                            }

                            // Never move original objects, clone them
                            target[name] = she.extend(deep, clone, copy);

                        // Don't bring in undefined values
                        } else if (copy !== undefined) {
                            target[name] = copy;
                        }
                    }
                }
            }

            // Return the modified object
            return target;
        },

        get: function(url){
            var myfn, 
                myQuery;

            if(typeof arguments[1] == 'function'){
                myfn = arguments[1];
                myQuery = {};
            } else if(typeof arguments[1] == 'object'){
                myQuery = arguments[1];
                myfn = arguments[2];
            }
            var queryData = require('querystring').stringify(myQuery),
                urlAcc = require('url').parse(url),
                opt = {
                    host: urlAcc.hostname,
                    port: urlAcc.port || 80,
                    path: urlAcc.pathname +  urlAcc.search,
                    method:'GET',
                    headers:{
                        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:24.0) Gecko/20100101 Firefox/24.0',
                        "Content-Type": 'application/x-www-form-urlencoded',  
                        "Content-Length": queryData.length 
                    }
                };

            var myReq = http.request(opt, function(result){
                var chunks = [],
                    size = 0;

                result.on('data', function(chunk){
                    size += chunk.length;
                    chunks.push(chunk);
                });

                result.on('end', function(){
                    var myBuffer = Buffer.concat(chunks, size);

                    if(myfn){
                        myfn(myBuffer);
                    }
                });
            });
            myReq.write('');
            myReq.end();
        }
    };

var USERPROFILE = process.env[process.platform == 'win32'? 'USERPROFILE': 'HOME'];

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
    BASE_PATH: util.joinFormat(__dirname, '..'),

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

module.exports = util;
