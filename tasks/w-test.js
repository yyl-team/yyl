'use strict';

var util = require('../lib/yyl-util.js');

var 
    wTest = function(){
        util.buildTree({
            // frontPath: 'path01/path02/path03',
            // path: 'F:/svn/code.yy.com/ent-FEteam/_test/pc',
            path: '/Volumes',
            dirList: [
                '/Volumes/sd128G/work/git/yy/code.yy.com/ent-FEteam/yy.com',
                '/Volumes/sd256G/work/git/yy/code.yy.com/ent-FEteam/yy.com',
                '/Volumes/sd256G/work/git/yy/code.yy.com/ent-FEteam/yy.com2'
            ],
            dirNoDeep: ['dist', 'html', 'css', 'js', 'templates', 'components', 'sass', 'node_modules', '.git', '.sass-cache']
        });

    };

module.exports = wTest;
