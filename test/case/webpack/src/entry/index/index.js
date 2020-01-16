import 'yyl-flexlayout';
import '@babel/polyfill';
import Vue from 'vue';
import { mapActions } from 'vuex';
import VueRouter from 'vue-router';

import store from '../../vuex/store.js';
import './index.scss';

const pageIndex = () => import(/* webpackChunkName: "pageIndex" */ '../../components/page/p-index/p-index.vue');
const pageSub = () => import(/* webpackChunkName: "pageSub" */ '../../components/page/p-sub/p-sub.vue');

Vue.use(VueRouter);

const router = new VueRouter({
  routes: [{
    path: '/index',
    component: pageIndex
  }, {
    path: '/sub',
    component: pageSub
  }, {
    path: '*',
    redirect: '/index'
  }]
});

new Vue({
  store,
  router,
  methods: {
    ...mapActions(['addDemoLog'])
  },
  mounted() {
    this.addDemoLog('index.js ready');
  }
}).$mount('#app');
