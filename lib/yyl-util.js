'use strict';
var color = require('./colors');
var 
    util = {
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
            error: function(txt){
                console.log(color.red('[error] ' + txt));
            },
            /**
             * 成功输出
             * @param  {String} txt 文本内容
             * @return {Void}
             */
            success: function(txt){
                console.log(color.cyan('[success] ' + txt));
            },
            /**
             * 一般输出
             * @param  {String} txt 文本内容
             * @return {Void}
             */
            notice: function(txt){
                console.log(color.yellow('[notice] ' + txt));
            },
            /**
             * 创造输出
             * @param {String} txt 文本内容
             */
            create: function(txt){
                console.log(color.green('[create] ' + txt));
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

module.exports = util;
