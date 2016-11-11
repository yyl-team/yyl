'use strict';
var 
    util = require('../lib/yyl-util');

var 
    events = {
        version: require('./w-version'),
        init: require('./w-init'),
        help: function(){
            util.help({
                usage: 'yyl',
                commands: {
                    'init': 'project init commands',
                    'update': 'update yyl workflow'
                },
                options: {
                    '-h, --help': 'print usage information',
                    '-v, --version': 'print yyl version'
                }
            });
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
