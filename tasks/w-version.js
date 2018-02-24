'use strict';
const chalk = require('chalk');
const wVersion = function() {
  var iVer = require('../package.json').version;
  console.log([
    '',
    '                  :                  ',
    '    ``        :++o+-      ```        ',
    '  :ooooooo++ooooooooo+sooooooo       ',
    '  oooooooooooooooooooooooooooo       ',
    '  oooooooooooooooooooooooooooo       ',
    '   ooooo+:`-/oooooos:``/ooooos       ',
    '   /oo+       -oos`      `ooo        ',
    '   oo/                     oo/       ',
    '  /oo                       oo       ',
    '  -oo          --`         -oo       ',
    '   +oo+-``-/oooooooos/-``-+oo`       ',
    '    /ooooooooooooooooooooooo         ',
    '       `soooooooooooooooooo` /+s+/-  ',
    '       soooooooooooooooooooooooooooo ',
    '      ooooooooooooooooooooooooooooooo',
    '     oooooooooooooooooooooooooooooooo',
    '     -:/ooooooooooooooooooooooooooooo',
    '        oooooooooooooooooooooooooooo ',
    '        +ooooooooooooooooo/```-::`   ',
    '         `sooossssoooo+:             ',
    '',
    `        ${chalk.yellow(`yyl version: ${iVer}`)}`
  ].join('\n'));

  return Promise.resolve(iVer);
};

module.exports = wVersion;
