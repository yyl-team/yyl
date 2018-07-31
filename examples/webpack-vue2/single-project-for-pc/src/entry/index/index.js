import Vue from 'vue';
import { mapActions } from 'vuex';
import VueRouter from 'vue-router';

import store from '../../vuex/store.js';
import './index.scss';

const pageIndex = () => import(/* webpackChunkName: "pageIndex" */ '../../components/page/p-index/p-index.js');
const pageSub = () => import(/* webpackChunkName: "pageSub" */ '../../components/page/p-sub/p-sub.js');


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
