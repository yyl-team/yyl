'use strict';
import './boot.scss';
import Vue from 'vue';
import VueRouter from 'vue-router';
import store from '../vuex/store.js';

Vue.use(VueRouter);

var 
    app = Vue.extend({
        el(){
            return '#app';
        },
        store,
        ready(){}
    }),
    router = new VueRouter();


router.map({
    '/index': {
        component: require('../components/page/p-index/p-index.js')
    }
});

router.redirect({
    '*': '/index'
});



router.start(app, '#app');






