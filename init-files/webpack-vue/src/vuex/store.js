'use strict';

var 
    util = require('util'),
    Vue = require('vue'),
    Vuex = require('vuex'),
    debugtoolVuex = require('debugtoolVuex'),
    statVuex = require('statVuex');

Vue.use(Vuex);
var state = util.extend({}, debugtoolVuex.state, statVuex.state);
var mutations = util.extend({}, debugtoolVuex.mutations, statVuex.mutations);

state = util.extend(state, {

});

mutations = util.extend(mutations, {

});

module.exports = new Vuex.Store({
    state: state,
    mutations: mutations
});
