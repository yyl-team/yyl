'use strict';
var util = require('./w-util.js');
var fs = require('fs');
var path = require('path');

var 
    REG = {
        IS_VERSION: /^\d+\.\d+\.\d+$/,
        PACKAGE: /package\.json$/,
        PACKAGE_LOCK: /package\-lock\.json$/,
        NODE_MODULES: /node_modules/,
    },
    INTERFACE = {
        NPM_DOWNLOAD: 'https://registry.npmjs.org/{$name}/-/{$name}-{$version}.tgz',
        VERSION: '~{$version}'
    },
    fn = {
        printIt: function(iPath) {
            return path.relative(util.vars.BASE_PATH, iPath);
        },
        render: function(src, obj){
            if(src && obj){
                return src.replace(/\{\$(\w+)\}/g, function(str, $1){
                    if(obj[$1]){
                        return obj[$1];
                    } else {
                        return '';
                    }
                });

            } else {
                return src;
            }

        }
    };

var 
    update = {
        help: function(){
            util.help({
                usage: 'yyl update <package> <version>',
                options: {
                    'package': 'package name in yyl',
                    'version': 'package version in yyl'
                }
            });
        },
        package: function(name, version){
            if(!name || !version){
                return update.help();
            }

            if(!version.match(REG.IS_VERSION)){
                return util.msg.error('version is not meet the rules:', version);
            }

            var packages = [];
            var packageLocks = [];
            var count = 0;

            util.readFilesSync(util.vars.BASE_PATH, function(iPath){
                var relativePath = util.joinFormat( path.relative(util.vars.BASE_PATH, iPath) );
                if(relativePath.match(REG.NODE_MODULES)){
                    return;

                } else if(relativePath.match(REG.PACKAGE)){
                    packages.push(iPath);

                } else if(relativePath.match(REG.PACKAGE_LOCK)){
                    packageLocks.push(iPath);
                }
            });

            packages.forEach(function(iPath){
                if(!fs.existsSync(iPath)){
                    return;
                }

                var pkg = util.requireJs(iPath);
                var isUpdate = false;

                if(!pkg){
                    return;
                }

                if(pkg.dependencies){
                    Object.keys(pkg.dependencies).forEach(function(key){
                        if(key == name){
                            var r = fn.render(INTERFACE.VERSION, { 'version': version });
                            if(pkg.dependencies[key] != r){
                                pkg.dependencies[key] = r;
                                isUpdate = true;
                            }
                            return true;
                        }
                    });

                }

                if(pkg.devDependencies){
                    Object.keys(pkg.devDependencies).forEach(function(key){
                        if(key == name){
                            var r = fn.render(INTERFACE.VERSION, { 'version': version });
                            if(pkg.devDependencies[key] != r){
                                isUpdate = true;
                                return true;
                            }
                        }
                    });
                }

                if(isUpdate){
                    fs.writeFileSync(iPath, JSON.stringify(pkg, null, 2));
                    util.msg.update(fn.printIt(iPath));
                    count++;
                }

            });

            packageLocks.forEach(function(iPath){
                if(!fs.existsSync(iPath)){
                    return;
                }

                var pkg = util.requireJs(iPath);
                var isUpdate = false;

                if(!pkg){
                    return;
                }

                if(pkg.dependencies){
                    Object.keys(pkg.dependencies).forEach(function(key){
                        if(key == name){
                            if(pkg.dependencies[key].version != version){
                                pkg.dependencies[key].version = version;
                                isUpdate = true;
                            }

                            var r = fn.render(INTERFACE.NPM_DOWNLOAD, {
                                'name': key,
                                'version': version
                            });

                            if(pkg.dependencies[key].resolved != r){
                                pkg.dependencies[key].resolved = r;
                                isUpdate = true;
                            }
                            return true;
                        }
                    });

                }

                if(pkg.devDependencies){
                    Object.keys(pkg.devDependencies).forEach(function(key){
                        if(key == name){
                            if(pkg.devDependencies[key].version != version){
                                pkg.devDependencies[key].version = version;
                                isUpdate = true;
                            }

                            var r = fn.render(INTERFACE.NPM_DOWNLOAD, {
                                'name': key,
                                'versioin': version
                            });
                            if(pkg.devDependencies[key].resolved != r){
                                pkg.devDependencies[key].resolved = r;
                                isUpdate = true;
                            }
                            return true;
                        }
                    });
                }

                if(isUpdate){
                    fs.writeFileSync(iPath, JSON.stringify(pkg, null, 2));
                    util.msg.update(fn.printIt(iPath));
                    count++;
                }

            });

            util.msg.line().info('update finished');
            util.msg.success('updated ' + count + ' files');


        },
        yyl: function(version){

            var iCmd = 'git checkout master & git pull';
            if(version){
                iCmd = 'git checkout '+ version +' & git pull';
            }
            
            util.msg.info(iCmd);
            util.runCMD(iCmd, function(){
                util.msg.success('yyl update finished');
            }, util.vars.BASE_PATH);

        },
        run: function(ctx, version){
            if(ctx) {
                if(ctx.match(REG.IS_VERSION)){ // 正常组件升级
                    update.yyl(ctx);

                } else if(version){ // package 更新 开发用功能
                    update.package(ctx, version);

                } else {
                    update.help();
                }

            } else {
                update.yyl();
            }
            

        }
    };

module.exports = update;
