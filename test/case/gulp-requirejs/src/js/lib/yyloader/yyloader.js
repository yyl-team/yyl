/*
 * yyloader
 * github: https://github.com/jackness1208/yyloader
 * version: 1.1.0
 */

'use strict';
(function() {
    var $ = window.jQuery || window.$;
    if (!$) {
        throw new Error('yyl-loader required jquery');
    }

    // + vars
    var LOCAL_STORAGE_NAME = 'yylloader_data';
    var IS_IE = ('ActiveXObject' in window && /(msie |Trident\/.*rv:)(\d*)/i.test(navigator.userAgent) ? RegExp.$2 : false);
    var LOCAL_STORAGE_SPPORTED = window.localStorage && !IS_IE;
    var LOCATION = top.location.href;
    // 有效时长
    var EXPRIE_TIME = 30 * 60 * 1000;
    var IS_DEBUG = /nocache/.test(LOCATION);
    var NO_CACHE = /nocache/.test(LOCATION);
    // - vars

    var localData = {};
    if (LOCAL_STORAGE_SPPORTED) {
        try {
            localData = JSON.parse(window.localStorage.getItem(LOCAL_STORAGE_NAME)) || {};
        } catch (er) {}
    }

    var cache = {
        queues: [],
        readyModule: {},
        waitings: []
    };


    var TEMPLATE_START = /^<!-- \+ tpl\s*-->/;
    var TEMPLATE_END = /<!-- - tpl\s*-->$/;

    var fn = {
        rouder: function(param, done) {
            if (
                localData[param.name] &&
                localData[param.name].url == param.url &&
                TEMPLATE_START.test(localData[param.name].tpl) &&
                TEMPLATE_END.test(localData[param.name].tpl) &&
                !IS_DEBUG
            ) {
                return done(null, localData[param.name].tpl);
            } else {
                $.ajax({
                    url: param.url,
                    contentType: 'text/html;charset=UTF-8',
                    success: function(tpl) {
                        if (!TEMPLATE_START.test(tpl) || !TEMPLATE_END.test(tpl)) {
                            return done('get tpl error, {$name} tpl is incomplete'.replace('{$name}', param.name));
                        }

                        if (LOCAL_STORAGE_SPPORTED) {
                            localData[param.name] = {
                                url: param.url,
                                tpl: tpl,
                                date: new Date().getTime()
                            };
                            window.localStorage.setItem(
                                LOCAL_STORAGE_NAME,
                                JSON.stringify(localData)
                            );
                        }
                        return done(null, tpl);
                    },
                    error: function(er) {
                        return done(er);
                    }
                });
            }
        },
        addWaiting: function(name, ref, fn) {
            cache.waitings.push({
                name: name,
                ref: ref,
                fn: fn
            });
        },
        checkModuleReady: function(ref) {
            var canRun = true;
            $(ref).each(function(index, name) {
                if (!name) {
                    return;
                }
                if (!cache.readyModule[name]) {
                    canRun = false;
                    return true;
                }
            });
            return canRun;
        },
        checkWaiting: function() {
            if (cache.waitings.length) {
                for (var i = 0; i < cache.waitings.length;) {
                    if (fn.checkModuleReady(cache.waitings[i].ref)) {
                        cache.waitings.splice(i, 1)[0].fn();
                    } else {
                        i++;
                    }
                }
            }
        }
    };

    var OPTION = {
        src: null,
        id: null,
        ref: null
    };

    var yyloader = function(ctx, op, done) {
        if (typeof op == 'function') {
            done = op;
            op = {};
        }
        op = $.fn.extend(OPTION, op);
        $(ctx).each(function() {
            var $el = $(this);
            var url = op.src || $el.data('loader-src');
            var name = op.id || $el.data('loader-id');
            var ref = op.ref || $el.data('loader-ref');

            if (ref) {
                ref = ref.split(/\s*,\s*/);
            } else {
                ref = [];
            }

            var finishHandle = function(tpl) {
                try {
                    $(tpl).insertBefore($el);
                } catch (er) {
                    throw new Error([name, 'insert error', er.message].join(' '));
                }
                $el.remove();
                cache.readyModule[name] = true;
                fn.checkWaiting();
                return done && done(null);
            };
            if (!url) {
                return;
            }
            if (!name) {
                name = $el.attr('id');
            }
            fn.rouder({
                url: url,
                name: name
            }, function(err, tpl) {
                if (err) {
                    var errMsg = ['yyloader loaded error:', url, err];
                    if (done) {
                        done(errMsg);
                    }
                    throw new Error(errMsg);
                }

                if (fn.checkModuleReady(ref)) {
                    finishHandle(tpl);
                } else {
                    fn.addWaiting(name, ref, function() {
                        finishHandle(tpl);
                    });
                }
            });
        });
    };

    // 清空 loader 缓存
    yyloader.clear = function() {
        if (!LOCAL_STORAGE_SPPORTED) {
            return;
        }
        window.localStorage.setItem(LOCAL_STORAGE_NAME, '{}');
        localData = {};
    };

    // 设置 缓存有效时长
    yyloader.setExprie = function(time) {
        if (!LOCAL_STORAGE_SPPORTED) {
            return;
        }
        // 去掉过期的数据
        var needUpdate = false;
        var now = new Date().getTime();
        for (var key in localData) {
            if (
                localData.hasOwnProperty(key) &&
                now - localData[key].date > time
            ) {
                delete localData[key];
                needUpdate = true;
            }
        }
        if (needUpdate) {
            window.localStorage.setItem(
                LOCAL_STORAGE_NAME,
                JSON.stringify(localData)
            );
        }
    };

    // 获取 loader 中的 cache列表
    yyloader.cache = localData;

    yyloader.setExprie(EXPRIE_TIME);

    yyloader.onModuleReady = function(moduleid, done) {
        if (cache.readyModule[moduleid]) {
            return done && done();
        } else {
            fn.addWaiting('onModuleReady', [moduleid], done);
        }
    };

    if (NO_CACHE) {
        yyloader.clear();
    }
    window.yyloader = yyloader;

    if (typeof define != 'undefined' && define.amd) {
        define('yyloader', [], function() {
            return yyloader;
        });
    } else if (typeof module != 'undefined' && module.exports) {
        module.exports = yyloader;
    }
})();
