'use strict';

var util = require('../lib/yyl-util.js');

var 
    wTest = function(){
        util.buildTree({
            // frontPath: 'path01/path02/path03',
            path: 'F:/svn/code.yy.com/ent-FEteam/_test/pc',
            dirNoDeep: ['dist', 'html', 'css', 'js', 'templates', 'components', 'sass']
        });

    };

module.exports = wTest;
