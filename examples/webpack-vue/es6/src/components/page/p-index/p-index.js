'use strict';
import Vue from 'vue';
import getters from 'getters';
import actions from 'actions';
import tpl from './p-index.jade';
import vDemo from '../../widget/v-demo/v-demo.js';

module.exports = Vue.extend({
    vuex: {
        getters,
        actions
    },
    template: tpl(),
    components: {
        vDemo
    },
    ready(){}
});

