'use strict';
// WebdriverIO
var
    yyl = require('../index.js'),
    expect = require('chai').expect,
    path = require('path'),
    fs = require('fs'),
    util = require('yyl-util'),
    FRAG_PATH = path.join(__dirname, 'frag'),
    FRAG_PATH2 = path.join(__dirname, 'frag2'),

    fn = {
        frag: {
            build: function() {
                if (fs.existsSync(FRAG_PATH)) {
                    util.removeFiles(FRAG_PATH);
                } else {
                    util.mkdirSync(FRAG_PATH);
                }

                if (fs.existsSync(FRAG_PATH2)) {
                    util.removeFiles(FRAG_PATH2);
                } else {
                    util.mkdirSync(FRAG_PATH2);
                }

            },
            destory: function() {
                if (fs.existsSync(FRAG_PATH)) {
                    util.removeFiles(FRAG_PATH, true);
                }

                if (fs.existsSync(FRAG_PATH2)) {
                    util.removeFiles(FRAG_PATH2, true);
                }

            }

        }
    };


describe('yyl init test', function() {

    var
        iWorkflows = util.readdirSync(path.join(__dirname, '../init-files'), /^\./),
        iInits,
        copyTask = function(workflow, init) {
            it('yyl init copy test, ' + workflow + ':' + init, function(done) {
                this.timeout(0); // 设置用例超时时间
                fn.frag.build();

                var sourcePath01 = path.join(__dirname, '../init-files', workflow);
                var sourcePath02 = path.join(__dirname, '../examples', workflow, init);
                var projectPath = FRAG_PATH;

                yyl.run('init ' + util.envStringify({
                    name: 'frag',
                    platform: 'pc',
                    workflow: workflow,
                    init: init,
                    doc: 'git',
                    silent: true
                }), function() { // 文件校验

                    var
                        rFiles = util.readFilesSync(projectPath),
                        s01Files = util.readFilesSync(sourcePath01, function(iPath) {
                            var relativePath = util.joinFormat(path.relative(sourcePath01, iPath));
                            if (/readme\.md|\.gitignore/i.test(iPath) && !/node_modules/.test(relativePath)) {
                                return true;
                            } else {
                                return false;
                            }
                        }),
                        s02Files = util.readFilesSync(
                            sourcePath02,
                            function(iPath) {
                                if (/package\.json|gulpfile\.js|\.DS_Store|\.sass-cache|dist|webpack\.config\.js|config\.mine\.js|node_modules/g.test(iPath)) {
                                    return false;

                                } else {
                                    return true;
                                }

                            }

                        ),
                        sFiles = [];

                    rFiles = rFiles.map(function(iPath) {
                        return util.joinFormat(path.relative(projectPath, iPath));
                    });

                    s01Files = s01Files.map(function(iPath) {
                        return util.joinFormat(path.relative(sourcePath01, iPath));
                    });

                    s02Files = s02Files.map(function(iPath) {
                        return util.joinFormat(path.relative(sourcePath02, iPath));
                    });

                    sFiles = s01Files.concat(s02Files);

                    rFiles.sort(function(a, b) {
                        return a.localeCompare(b);
                    });

                    sFiles.sort(function(a, b) {
                        return a.localeCompare(b);
                    });

                    expect(rFiles).to.deep.equal(sFiles);

                    fn.frag.destory();
                    done();
                }, FRAG_PATH);
            });
        };

    iWorkflows.forEach(function(workflow, i) {
        var inits = util.readdirSync(path.join(__dirname, '../examples', workflow), /^\./);
        if (i === 0) {
            iInits = inits;
        }


        inits.forEach(function(init) {
            copyTask(workflow, init);
        });

    });



    // it('yyl init --doc svn test', function(done){
    //     // TODO
    //     done();
    // });

    // it('yyl init --platform moble test', function(done){
    //     // TODO
    //     done();
    // });


    // it('yyl init --name any test', function(done){
    //     // TODO
    //     done();
    // });

});

// describe('yyl ui test', function() {
//     var
//         iWorkflows = util.readdirSync(path.join(__dirname, '../init-files')),
//         iInits,
//         uiTask = function(workflow, init) {
//             it('yyl ui test, ' + workflow + ':' + init, function(done) {
//                 this.timeout(0); // 设置用例超时时间
//                 fn.frag.destory();
//                 fn.frag.build();

//                 new util.Promise(function(next) { // 项目初始化
//                     yyl.run('init ' + util.envStringify({
//                         name: 'frag',
//                         platform: 'pc',
//                         workflow: workflow,
//                         init: init,
//                         doc: 'git',
//                         silent: true
//                     }), next, FRAG_PATH);
//                 }).then(function(next) { // 项目监听
//                     var userConfig = util.requireJs(util.vars.USER_CONFIG_FILE);
//                     var names = [];

//                     if (userConfig.workflow) {
//                         next(names);
//                     } else {
//                         Object.keys(userConfig).forEach(function(key) {
//                             if (userConfig[key].workflow) {
//                                 names.push(key);
//                             }
//                         });
//                         if (names.length) {
//                             next(names);

//                         } else {
//                             done('config is not in roles');
//                         }
//                     }
//                 }).then(function(names, next) { // 项目监听

//                     if (names.length) {
//                         var iName = names[0];
//                         yyl.run('all ' + util.envStringify({
//                             silent: true,
//                             name: iName
//                         }), function() {
//                             next(util.getConfigSync({
//                                 name: iName
//                             }));

//                         }, FRAG_PATH);


//                     } else {
//                         yyl.run('all --silent', function(){
//                             next(util.getConfigSync({}));
//                         }, FRAG_PATH);
//                     }

//                 }).then(function(config, next) { // 查找 demo.html
//                     var demoPath = [];
//                     util.readFilesSync(config.alias.htmlDest, function(iPath){
//                         if(/demo\.html/.test(iPath)){
//                             demoPath.push(iPath);
//                         }
//                     });

//                     demoPath = demoPath[0];

//                     if(demoPath){
//                         var hostname = 'http://' + util.vars.LOCAL_SERVER + ':' + config.localserver.port;
//                         var relativePath = util.path.relative(config.alias.destRoot, demoPath);
//                         var openPath = util.path.join(hostname, relativePath);
//                         next(config, openPath);

//                     } else {
//                         done('cannot find the demo.html in dest');
//                     }
//                 }).then(function(config, demoPath, next) { // 开启服务器
//                     yyl.server.start(config.alias.destRoot, config.localserver.port, true, function(){
//                         next(demoPath);
//                     });

//                 }).then(function(demoPath, next) { // TODO 页面测试
//                     yyl.server.abort(function(){
//                         next(null);
//                     });
//                     // console.log('===', demoPath);
//                     // var ph = null;

//                     // phantom.create()
//                     //     .then(function(instance){
//                     //         ph = instance;
//                     //         return instance.createPage();
//                     //     }).then(function(page){
//                     //         console.log('openopen')
//                     //         var errMsg;

//                     //         page.property('onResourceReceived', function(response){
//                     //             if(response.status != 200){
//                     //                 next(workflow + ':' + init + ' run error, resource 404: ' + response.url);
//                     //             }
//                     //         });
//                     //         page.property('onError', function(msg){
//                     //             console.log('===', 'onError', status);
//                     //             errMsg = msg;
//                     //         });
//                     //         page.property('onLoadFinished', function(status){
//                     //             console.log('===', 'onLoadFinished', status);
//                     //             if(status == 'success'){
//                     //                 console.log(111)
//                     //                 ph.kill();
//                     //                 console.log(222)
//                     //                 next(errMsg);
                                    
//                     //             } else {
//                     //                 ph.exit();
//                     //                 // phantom.exit();
//                     //                 next(workflow + ':' + init + ' run error, resource 404: ' + demoPath);
//                     //             }


//                     //         });
//                     //         page.open(demoPath);


//                     //     }).catch(function(er){
//                     //         console.log('===','onerror')
//                     //         ph.exit();
//                     //         next(er);
//                     //     });


//                 }).then(function(err) { // 去掉生成的文件
//                     // console.log('next!')
//                     fn.frag.destory();
//                     done(err);

//                 }).start();

//             });
//         };

//     iWorkflows = [iWorkflows[0]]; // test
//     iWorkflows.forEach(function(workflow, i) {
//         var inits = util.readdirSync(path.join(__dirname, '../examples', workflow));
//         inits = ['single-project']; // test
//         if (i === 0) {
//             iInits = inits;
//         }


//         inits.forEach(function(init) {
//             uiTask(workflow, init);
//         });

//     });
//     // it('ui test', function(done){
//     //     this.timeout(0);
//     //     var sitepage = null;
//     //     var phInstance = null;

//     //     phantom.create()
//     //         .then(function(instance){
//     //             phInstance = instance;
//     //             return instance.createPage();
//     //         }).then(function(page){

//     //             page.open('http://www.yy.com', function(s){
//     //                 console.log('===', 'done');
//     //                 expect(s).to.equal(200);
//     //                 done();
//     //             });


//     //         }).catch(function(er){
//     //             console.log('===','onerror')
//     //             util.msg.error(er);
//     //             phInstance.exit();
//     //             expect(er).to.equal(null);
//     //             done();
//     //         });

//     // });
// });