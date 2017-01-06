#!/usr/bin/env node
'use strict';
var 
    util = require('../lib/yyl-util.js'),
    vars = util.vars;

var iCMD;
if(vars.IS_WINDOWS){
    iCMD = 'start uninstall.bat';

} else {
    iCMD = 'sh uninstall.sh';

}
util.runCMD(iCMD, null, __dirname);
