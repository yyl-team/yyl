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
        resetFrag: function() {
            if(fs.existsSync(FRAG_PATH)){
                util.removeFiles(FRAG_PATH);
            } else {
                util.mkdirSync(FRAG_PATH);
            }

        },
        removeFrag: function(){
            if(fs.existsSync(FRAG_PATH)){
                util.removeFiles(FRAG_PATH, true);
            }

        }
    };

describe('yyl init test', function() {

    fn.resetFrag();
    var iWorkflows = util.readdirSync(path.join(__dirname, '../init-files'));
    console.log('===', iWorkflows);

    iWorkflows.forEach(function(workflow){
        var inits = util.readdirSync(path.join(__dirname, '../examples', workflow));
    });

    // it('yyl init test', function(){
    //     yyl.run('init ' + util.envStringify({
    //         name: 'frag',
    //         platform: 'pc',
    //         workflow: 'gulp-requirejs',
    //         init: 'single-project',
    //         doc: 'git',
    //         silent: true,
    //         cwd: FRAG_PATH
    //     }), function(){
    //         console.log('done');
    //         fn.removeFrag();

    //     });
    // });
    // it('usage test', function() {
    //     expect(util.readdirSync(path.join(__dirname, '../'), /node_modules/)).to.not.include('node_modules');
    // });
});
