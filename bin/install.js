#!/usr/bin/env node
'use strict';
var 
    util = require('../lib/yyl-util.js'),
    vars = util.vars;

var iCMD;
if(vars.IS_WINDOWS){
    iCMD = 'start install.bat';

} else {
    iCMD = 'sh install.sh';

}
util.runCMD(iCMD, null, __dirname);
