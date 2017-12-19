'use strict';
var 
    yyl = require('../index.js'),
    expect = require('chai').expect,
    path = require('path'),
    fs = require('fs'),
    util = require('yyl-util'),
    FRAG_PATH = path.join(__dirname, '../frag'),
    FRAG_PATH2 = path.join(__dirname, '../frag2');

describe('yyl workflow gulp-requirejs test', function() {

    util.mkdirSync(FRAG_PATH);
    util.removeFiles(FRAG_PATH);

    it('yyl init test', function(){
        expect(yyl.run('init ' + util.envStringify({
            name: 'frag',
            platform: 'pc',
            workflow: 'gulp-requirejs',
            init: 'singer-project',
            doc: 'git'
        })));
    });
    // it('usage test', function() {
    //     expect(util.readdirSync(path.join(__dirname, '../'), /node_modules/)).to.not.include('node_modules');
    // });
});

describe('yyl workflow gulp-rollup test', function() {
    
});

describe('yyl workflow webpack-vue test', function() {
    
});

describe('yyl workflow webpack-vue2 test', function() {
    
});
