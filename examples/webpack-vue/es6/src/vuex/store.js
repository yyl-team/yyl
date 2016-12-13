'use strict';
import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

let state = {};
let mutations = {};

module.exports = new Vuex.Store({
    state: state,
    mutations: mutations
});
