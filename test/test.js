'use strict';
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
            build: function(){
                if(fs.existsSync(FRAG_PATH)){
                    util.removeFiles(FRAG_PATH);
                } else {
                    util.mkdirSync(FRAG_PATH);
                }

                if(fs.existsSync(FRAG_PATH2)){
                    util.removeFiles(FRAG_PATH2);
                } else {
                    util.mkdirSync(FRAG_PATH2);
                }

            },
            destory: function(){
                if(fs.existsSync(FRAG_PATH)){
                    util.removeFiles(FRAG_PATH, true);
                }

                if(fs.existsSync(FRAG_PATH2)){
                    util.removeFiles(FRAG_PATH2, true);
                }

            }

        }
    };

describe('yyl init test', function() {

    var 
        iWorkflows = util.readdirSync(path.join(__dirname, '../init-files')),
        iInits,
        copyTask = function(workflow, init){
            it('yyl init copy test, ' + workflow + ':' + init, function(done){
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
                    silent: true,
                    cwd: FRAG_PATH
                }), function(){ // 文件校验
                    var 
                        rFiles = util.readFilesSync(projectPath),
                        s01Files = util.readFilesSync(sourcePath01, function(iPath){
                            if(/readme\.md|\.gitignore/i.test(iPath)){
                                return true;
                            } else {
                                return false;
                            }
                        }),
                        s02Files = util.readFilesSync(
                            sourcePath02, 
                            function(iPath){
                                if(/package\.json|gulpfile\.js|\.DS_Store|\.sass-cache|dist|webpack\.config\.js|config\.mine\.js|node_modules/g.test(iPath)){
                                    return false;

                                } else {
                                    return true;
                                }

                            }
                            
                        ),
                        sFiles = [];

                    rFiles = rFiles.map(function(iPath){
                        return util.joinFormat(path.relative(projectPath, iPath));
                    });

                    s01Files = s01Files.map(function(iPath){
                        return util.joinFormat(path.relative(sourcePath01, iPath));
                    });

                    s02Files = s02Files.map(function(iPath){
                        return util.joinFormat(path.relative(sourcePath02, iPath));
                    });

                    sFiles = s01Files.concat(s02Files);

                    rFiles.sort(function(a, b){
                        return a.localeCompare(b);
                    });

                    sFiles.sort(function(a, b){
                        return a.localeCompare(b);
                    });

                    expect(rFiles).to.deep.equal(sFiles);

                    fn.frag.destory();
                    done();
                });
            });
        };

    iWorkflows.forEach(function(workflow, i){
        var inits = util.readdirSync(path.join(__dirname, '../examples', workflow));
        if(i === 0){
            iInits = inits;
        }

        inits.forEach(function(init){
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
