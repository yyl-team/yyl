'use strict';
var 
    color = require('../lib/colors'),
    util = require('../lib/yyl-util');

var 
    events = {
        version: function(){
            var iVer = require('../package.json').version;
            console.log([
                color.yellow('---------------------'),
                ' yyl version: ' + iVer,
                color.yellow('---------------------')
            ].join("\n"));

        },
        help: function(){
            util.help({
                usage: 'yyl',
                commands: {
                    'init': 'project init commands',
                },
                options: {
                    '-h, --help': 'print usage information',
                    '-v, --version': 'print yyl version'
                }
            });

        },
        init: function(){

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

        case 'init':
            events.init();
            break;

        default:
            events.help();
            break;
    }
};
