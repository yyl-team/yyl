
// requires
require('./v-demo.scss');

// init
const Vue = require('vue');
const actions = require('actions');
const getters = require('getters');

const cache = {};

module.exports = Vue.extend({
  template: require('./v-demo.jade')(),
  vuex: {
    actions,
    getters,
  },

  data() {
    return {
      rotate: 0,
    };
  },
  ready() {
    const vm = this;

    let i;
    const iClass = [0, 1, 2, 3];

    cache.changeKey = setInterval(() => {
      const here = iClass.concat([]);
      here.splice(here.indexOf(i), 1);
      vm.$data.rotate = here[Math.round(Math.random() * (here.length - 1))];
    }, 2000);
  },
  beforeDestroy() {
    clearInterval(cache.changeKey);
  },
});
