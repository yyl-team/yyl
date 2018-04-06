
require('./boot.scss');
const Vue = require('vue');
const VueRouter = require('vue-router');
const store = require('../vuex/store.js');

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
    component: require('../components/page/p-index/p-index.js'),
  },
});

router.redirect({
  '*': '/index',
});


router.start(app, '#app');

