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
        debugtool: require('debugtool')
    },
    ready: function(){
        this.trace('info', 'hello world');

    }
});

