'use strict';
import Vue from 'vue';
import tpl from './v-demo.jade';
import './v-demo.scss';

import vDemo from '../../widget/v-demo/v-demo.js';
var cache = {};

export default Vue.extend({
    template: tpl(),
    data(){
        return {
            rotate: 0
        };
    },
    components: {
        vDemo
    },
    mounted(){
        var vm = this;

        var i;
        var iClass = [0, 1, 2, 3];

        cache.changeKey = setInterval(function(){
            var here = iClass.concat([]);
            here.splice(here.indexOf(i), 1);

            vm.$data.rotate = here[Math.round(Math.random() * (here.length - 1))];
        }, 2000);

    },
    beforeDestroy(){
        clearInterval(cache.changeKey);
    }
});
