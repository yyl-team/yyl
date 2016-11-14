'use strict';
var 
    util = require('../lib/yyl-util'),
    vars = util.vars,
    color = require('../lib/colors'),
    fs = require('fs'),
    path = require('path');

var events = {
    help: function(){
        util.help({
            usage: 'yyl server',
            commands: {
                '?': '...'
            },
            options: {
                '-h, --help': 'print usage information',
                '--p, --path': 'show the yyl server local path'
            }
        });

    },
    path: function(){
        console.log([
            '',
            'yyl server path:',
            color.yellow(vars.SERVER_PATH),
            ''
        ].join('\n'));

        util.openPath(vars.SERVER_PATH);

    }
};

module.exports = function(){
    var
        iArgv = util.makeArray(arguments),
        ctx = iArgv[1];

    switch(ctx){
        case '--path':
        case '--p':
            events.path();
            break;

        case '--h':
        case '--help':
            events.help();
            break;

        default:
            events.help();
            break;
    }

};
