'use strict';
var 
    util = require('yyl-util'),
    path = require('path');

module.exports = util.extend(util.vars, {
    BASE_PATH: path.join(__dirname, '..')
});

