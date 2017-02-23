#!/usr/bin/env node
'use strict';
var IS_WINDOWS = process.platform == 'win32';
var iCMD;
if(IS_WINDOWS){
    iCMD = 'start install.bat';

} else {
    iCMD = 'sh install.sh';

}

var child = require('child_process').exec(iCMD, {
    maxBuffer: 2000 * 1024,
    cwd: __dirname
});

child.stdout.setEncoding('utf8');
child.stdout.pipe(process.stdout);
child.stderr.pipe(process.stderr);
