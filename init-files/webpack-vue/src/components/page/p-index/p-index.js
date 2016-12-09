'use strict';
var 
    Vue = require('vue');

module.exports = Vue.extend({
    vuex: {
        getters: require('getters'),
        actions: require('actions')
    },
    template: require('./p-index.jade')(),
    components: {
        vDemo: require('../../widget/v-demo/v-demo.js')
    },
    ready: function(){
    }
});

