'use strict';
require('./sub.scss');
var 
    Vue = require('vue'),
    VueRouter = require('vue-router'),
    store = require('../../vuex/store.js');

Vue.use(VueRouter);

var 
    app = Vue.extend({
        el: function(){
            return '#app';
        },
        store: store,
        ready: function(){}
    }),
    router = new VueRouter();


router.map({
    '/index': {
        component: require('../../components/page/p-index/p-index.js')
    }
});

router.redirect({
    '*': '/index'
});



router.start(app, '#app');





