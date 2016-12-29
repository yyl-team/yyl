'use strict';
import './v-demo.scss';
import Vue from 'vue';
import actions from 'actions';
import getters from 'getters';
import tpl from './v-demo.jade';

// init
var 
    cache = {

    };

module.exports = Vue.extend({
    template: tpl(),
    vuex: {
        actions,
        getters
    },

    data(){
        return {
            rotate: 0
        };
    },
    ready(){
        var vm = this;

        let i;
        let iClass = [0, 1, 2, 3];

        cache.changeKey = setInterval(function(){
            let here = iClass.concat([]);
            here.splice(here.indexOf(i), 1);

            vm.$data.rotate = here[Math.round(Math.random() * (here.length - 1))];
        }, 2000);
    },
    beforeDestroy(){
        clearInterval(cache.changeKey);
    }
});
