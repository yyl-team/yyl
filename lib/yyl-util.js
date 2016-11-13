'use strict';
var 
    color = require('./colors'),
    fs = require('fs'),
    os = require('os'),
    path = require('path');

var 
    
    util = {
        
        joinFormat: function(){
            var iArgv = Array.prototype.slice.call(arguments);
            var r = path.join.apply(path, iArgv);
            return r
                .replace(/\\+/g, '/')
                .replace(/(^http[s]?:)[\/]+/g, '$1//');

        },
        /**
         * 运行 cmd
         * @param  {String|Array} str           cmd执行语句 or 数组
         * @param  {funciton}     callback      回调函数
         *                        - json.status 状态码 1:成功, 0:失败
         *                        - json.error  错误信息
         * @return {Void}
         */
        runCMD: function(str, callback, path, showOutput){
            var myCmd = require('child_process').exec,
                r = {
                    status:0,
                    error:''
                },
                child;

            if(showOutput === undefined){
                showOutput = true;
            }
            if (!str) {
                r.error = '没任何 cmd 操作';
                return callback(r);
                
            }
            if (!/Array/.test(Object.prototype.toString.call(str))) {
                str = [str];
            }

            child = myCmd(str.join(" && "),{
                maxBuffer: 2000 * 1024,
                cwd: path || ''
            }, function(err){
                if(err){
                    // r.error = err.stack.replace(/(\r|\n|\t)+/g,';').replace(/\s+/g,' ').replace(/:[^;:]+;/g,':');
                    if(showOutput){
                        console.log('cmd运行 出错');
                        console.log(err.stack);
                    }
                    r.error = 'cmd运行 出错';
                    return callback && callback(r);
                    
                } else {
                    r.status = 1;
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

                            if(filters && filters.test(myFile)){
                                if(!--padding){
                                    return done();
                                }
                            } else if(stat.isDirectory()){
                                if(!fs.existsSync(targetFile)){
                                    fs.mkdirSync(targetFile);
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
                },
                stat;

            padding++;
            for(var iPath in list){
                if(list.hasOwnProperty(iPath)){
                    stat = fs.statSync(iPath);
                    if(stat.isDirectory()){
                        padding++;
                        pathCopy(iPath + '/', list[iPath] + '/', paddingJian, filters, basePath);

                    } else {
                        padding++;
                        fileCopy(iPath, list[iPath], filters, render, basePath);
                        paddingJian();
                    }
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
            /**
             * 错误输出
             * @param  {String} txt 文本内容
             * @return {Void}
             */
            error: function(){
                var iArgv = util.makeArray(arguments);
                iArgv.unshift(color.red('[error]'));
                this.log.apply(this, iArgv);
            },

            info: function(){
                var iArgv = util.makeArray(arguments);
                iArgv.unshift(color.yellow('[info]'));
                this.log.apply(this, iArgv);
            },
            log: function(){
                var iArgv = util.makeArray(arguments);
                console.log.apply(console, iArgv);
            },
            /**
             * 成功输出
             * @param  {String} txt 文本内容
             * @return {Void}
             */
            success: function(){
                var iArgv = util.makeArray(arguments);
                iArgv.unshift(color.cyan('[success]'));
                this.log.apply(this, iArgv);
            },
            /**
             * 一般输出
             * @param  {String} txt 文本内容
             * @return {Void}
             */
            notice: function(){
                var iArgv = util.makeArray(arguments);
                iArgv.unshift(color.yellow('[notice]'));
                this.log.apply(this, iArgv);
            },
            /**
             * 创造输出
             * @param {String} txt 文本内容
             */
            create: function(){
                var iArgv = util.makeArray(arguments);
                iArgv.unshift(color.blue('[create]'));
                this.log.apply(this, iArgv);
            },
            /**
             * 输出分割线
             * @return {Object} msg
             */
            line: function(){
                console.log('\n' + color.gray('----------------------'));
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
        }
    };

util.vars = {
    IS_WINDOWS: process.platform == 'win32',
    // 当前cmd 所在地址
    PROJECT_PATH: util.joinFormat(process.cwd()),

    // 用户设置文件地址
    USER_CONFIG_FILE: util.joinFormat(process.cwd(), 'config.js'),

    // 用户 package.json 地址
    USER_PKG_FILE: util.joinFormat(process.cwd(), 'package.json'),

    // 本程序根目录
    BASE_PATH: util.joinFormat(__dirname, '../'),

    // server 根目录
    SERVER_PATH: util.joinFormat(process.env[process.platform == 'win32'? 'USERPROFILE': 'HOME'], '.yyl'),

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
