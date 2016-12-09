'use strict';
// requires
require('./v-demo.scss');

// init
var 
    Vue = require('vue'),
    actions = require('actions'),
    getters = require('getters'),
    cache = {

    };

module.exports = Vue.extend({
    template: require('./v-demo.jade')(),
    vuex: {
        actions: actions,
        getters: getters
    },

    data: function(){
        return {
            rotate: 0
        };
    },
    ready: function(){
        var vm = this;

        var i;
        var iClass = [0, 1, 2, 3];

        cache.changeKey = setInterval(function(){
            var here = iClass.concat([]);
            here.splice(here.indexOf(i), 1);

            vm.$data.rotate = here[Math.round(Math.random() * (here.length - 1))];
        }, 2000);
    },
    beforeDestroy: function(){
        clearInterval(cache.changeKey);
    }
});
