'use strict';

var 
    Vue = require('vue'),
    Vuex = require('vuex');

Vue.use(Vuex);

var state = {};
var mutations = {};

module.exports = new Vuex.Store({
    state: state,
    mutations: mutations
});
