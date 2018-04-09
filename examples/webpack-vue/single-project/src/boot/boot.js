import Vue from 'vue';
import VueRouter from 'vue-router';

import './boot.scss';
import store from '../vuex/store.js';
import tpl from '../components/page/p-index/p-index.vue';

Vue.use(VueRouter);

const app = Vue.extend({
  el() {
    return '#app';
  },
  store,
  ready() {
    console.log('111')
    console.log(tpl);
  },
});
const router = new VueRouter();


router.map({
  '/index': {
    component: tpl,
  },
});

router.redirect({
  '*': '/index',
});


router.start(app, '#app');

