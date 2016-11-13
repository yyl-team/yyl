#!/usr/bin/env node
"use strict";

var myArgv = process.argv.splice(2),
    domain = require('domain'),
    path = require('path'),
    fs = require('fs'),
    d = domain.create();

d.on('error', function(err){
    console.error('domain error catch\n', err.stack);
});

process.on('uncaughtException', function (err) {
    console.error('Uncaught exception:\n', err.stack);
});
process.on('exit', function(code){
    // console.error(' the exit: ' + code);
});

d.run(function(){
    require(path.join(__dirname, '../tasks/w-cmd')).apply(global, myArgv);
});

