
require('./sub.scss');
let
  Vue = require('vue'),
  VueRouter = require('vue-router'),
  store = require('../../vuex/store.js');

Vue.use(VueRouter);

let
  app = Vue.extend({
    el() {
      return '#app';
    },
    store,
    ready() {},
  }),
  router = new VueRouter();


router.map({
  '/index': {
    component: require('../../components/page/p-index/p-index.js'),
  },
});

router.redirect({
  '*': '/index',
});


router.start(app, '#app');

