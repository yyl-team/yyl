import Vue from 'vue';
import VueRouter from 'vue-router';

import store from '../../vuex/store.js';
import './index.scss';
import pageIndex from '../../components/page/p-index/p-index.vue';

Vue.use(VueRouter);

const app = Vue.extend({
  el() {
    return '#app';
  },
  store,
  ready() {}
});
const router = new VueRouter();

router.map({
  '/index': {
    component: pageIndex
  }
});

router.redirect({
  '*': '/index'
});


router.start(app, '#app');

