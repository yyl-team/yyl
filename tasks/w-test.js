'use strict';

var util = require('./w-util.js');

var 
    wTest = function(){
        
        util.buildTree({
            frontPath: 'tool.jackness.org',
            path: process.cwd(),
            dirFilter: /\.svn|\.git|\.sass-cache|node_modules|gulpfile\.js|package\.json|webpack\.config\.js|config\.mine\.js/,
            dirNoDeep: ['html', 'js', 'css', 'dist', 'images', 'sass', 'components'],
            
        });

    };

module.exports = wTest;
