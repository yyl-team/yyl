'use strict';
var color = require('yyl-color');
var util = require('./w-util.js');
var vars = util.vars;

var
  events = {
    version: require('./w-version'),
    init: require('./w-init'),
    optimize: require('./w-optimize'),
    server: require('./w-server'),
    test: require('./w-test'),
    commit: require('./w-commit'),
    remove: require('./w-remove'),
    debug: require('./w-debug'),
    supercall: require('./w-supercall'),
    update: require('./w-update'),
    make: require('./w-make'),
    info: require('./w-info'),
    jade2pug: require('./w-jade2pug'),
    help: function() {
      util.help({
        usage: 'yyl',
        commands: {
          'init': 'init commands',
          'info': 'information',
          'watch': 'watch task',
          'all': 'optimize task',
          'server': 'local server commands',
          'examples': 'show yyl examples',
          'commit': 'commit code to svn/git server(need config)',
          'update': 'update yyl from npm',
          'make': 'make new component',
          'jade2pug': 'transform *.jade to *.pug'
        },
        options: {
          '-h, --help': 'print usage information',
          '-v, --version': 'print yyl version',
          '-p, --path': 'show the yyl command local path',
          '--logLevel': 'log level'
        }
      });
    },
    path: function() {
      console.log([
        '',
        'yyl command path:',
        color.yellow(vars.BASE_PATH),
        ''
      ].join('\n'));

      util.openPath(vars.BASE_PATH);
    },
    examples: function() {
      var iPath = util.joinFormat(vars.BASE_PATH, 'examples');
      console.log([
        '',
        'yyl examples:',
        color.yellow(iPath),
        ''
      ].join('\n'));

      util.openPath(iPath);
    }
  };


module.exports = function(ctx) {
  var
    iArgv = util.makeArray(arguments);

  var iVer = process.versions.node;
  if (iVer.localeCompare('4.0.0') < 0) {
    return util.msg.error('please makesure your node >= 4.0.0');
  }
  switch (ctx) {
    case '-v':
    case '--version':
      events.version();
      break;


    case '-h':
    case '--help':
      events.help();
      break;

    case '--path':
    case '-p':
      events.path();
      break;

    case 'init':
      events.init.apply(events, iArgv);
      break;


    case 'html':
    case 'js':
    case 'css':
    case 'images':
    case 'watch':
    case 'watchAll':
    case 'all':
    case 'connect':
    case 'concat':
    case 'rev':
    case 'resource':
      events.optimize.apply(events, iArgv);
      break;

    case 'server':
      events.server.run.apply(events.server, iArgv);
      break;

    case 'commit':
      events.commit.run.apply(events.commit, iArgv);
      break;

    case 'examples':
    case 'example':
      events.examples();
      break;

    case 'rm':
      events.remove.apply(events, iArgv.slice(1));
      break;

    case 'test':
      events.test();
      break;

    case 'supercall':
      events.supercall.run.apply(events.supercall, iArgv);
      break;

    case 'update':
      events.update.run.apply(events.update, iArgv.slice(1));
      break;

    case 'make':
      events.make.run.apply(events, iArgv.slice(1));
      break;

    case 'jade2pug':
      events.jade2pug.run.apply(events, iArgv);
      break;

    case 'debug':
      events.debug.apply(events, iArgv.slice(1));
      break;

    case 'info':
      events.info.run.apply(events, iArgv.slice(1));
      break;

    default:
      events.help();
      break;
  }
};
