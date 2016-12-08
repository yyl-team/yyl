'use strict';
var 
    util = require('util'),
    debugtoolVuex = require('debugtoolVuex'),
    statVuex = require('statVuex');

var getters = util.extend({}, debugtoolVuex.getters, statVuex.getters);


getters = util.extend( debugtoolVuex.getters, {
    
});

module.exports = getters;
