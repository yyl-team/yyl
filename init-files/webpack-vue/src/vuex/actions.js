'use strict';
var
    util = require('util'),
    debugtoolVuex = require('debugtoolVuex'),
    statVuex = require('statVuex');

var actions = util.extend({}, debugtoolVuex.actions, statVuex.actions);

actions = util.extend(actions, {

});

module.exports = actions;
