import Vue from 'vue';
import VueRouter from 'vue-router';

import './boot.scss';
import store from '../vuex/store.js';
import pIndex from '../components/page/p-index/p-index.js';

Vue.use(VueRouter);

const app = Vue.extend({
  el() {
    return '#app';
  },
  store,
  ready() {},
});
const router = new VueRouter();


router.map({
  '/index': {
    component: pIndex,
  },
});

router.redirect({
  '*': '/index',
});


router.start(app, '#app');

