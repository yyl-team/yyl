import Vue from 'vue';
import { mapActions } from 'vuex';
import VueRouter from 'vue-router';

import store from '../../vuex/store.js';
import './index.scss';
import pageIndex from '../../components/page/p-index/p-index.js';
// const pageIndex = () => import('../../components/page/p-index/p-index.js');

Vue.use(VueRouter);

const router = new VueRouter({
  routes: [{
    path: '/index',
    component: pageIndex
  }, {
    path: '*',
    component: pageIndex
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
