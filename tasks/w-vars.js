'use strict';
var 
    util = require('./w-util.js'),
    path = require('path');

module.exports = util.extend(util.vars, {
    BASE_PATH: path.join(__dirname, '..')
});

