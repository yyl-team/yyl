'use strict';

var 
    Vue = require('vue'),
    Vuex = require('vuex'),
    util = require('util'),
    debugtoolVuex = require('debugtoolVuex');

Vue.use(Vuex);

var state = util.extend({}, debugtoolVuex.state);
var mutations = util.extend({}, debugtoolVuex.mutations);

state = util.extend( state, {

});

mutations = util.extend(mutations, {

});

module.exports = new Vuex.Store({
    state: state,
    mutations: mutations
});

