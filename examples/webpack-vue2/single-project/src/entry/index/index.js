import Vue from 'vue';
import VueRouter from 'vue-router';

import store from '../vuex/store.js';
import './boot.scss';
import pageIndex from '../components/page/p-index/p-index.js';

Vue.use(VueRouter);

const router = new VueRouter({
  routes: [{
    path: '/index',
    component: pageIndex,
  }, {
    path: '*',
    component: pageIndex,
  }],
});

new Vue({ store, router }).$mount('#app');
