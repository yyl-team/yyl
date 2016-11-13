'use strict';
var 
    util = require('../lib/yyl-util'),
    path = require('path'),
    color = require('../lib/colors');


var 
    events = {
        version: require('./w-version'),
        init: require('./w-init'),
        help: function(){
            util.help({
                usage: 'yyl',
                commands: {
                    'init': 'project init commands',
                    'watch': 'project watch',
                    'server': 'local server commands',
                    'update': 'update yyl workflow'
                },
                options: {
                    '-h, --help': 'print usage information',
                    '-v, --version': 'print yyl version',
                    '--path': 'show the yyl command local path'
                }
            });
        },
        update: function(){
            util.runCMD('git pull', function(err){
                if(err){
                    console.log([
                    color.red('yyl update error!')
                ].join('\n'));
                    return;
                }

                console.log([
                    '--------------------',
                    'yyl update complete!'
                ].join('\n'));

            }, path.join(__dirname, '../'));

        },
        path: function(){
            var rootPath = path.join(__dirname, '..');
            console.log([
                'yyl command path:',
                color.yellow(rootPath)
            ].join('\n'));



        }
    };


module.exports = function(ctx){
    switch(ctx){
        case '-v': 
        case '--version':
            events.version();
            break;

        case '-h':
        case '--help':
            events.help();
            break;

        case '--path':
            events.path();
            break;

        case 'init':
            events.init();
            break;

        case 'update':
            events.update();
            break;

        default:
            events.help();
            break;
    }
};
