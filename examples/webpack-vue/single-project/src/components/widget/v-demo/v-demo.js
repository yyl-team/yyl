import Vue from 'vue';
import actions from 'actions';
import getters from 'getters';
import './v-demo.scss';
import tpl from './v-demo.jade';

// init
const cache = {};

module.exports = Vue.extend({
  template: tpl(),
  vuex: {
    actions,
    getters
  },

  data() {
    return {
      rotate: 0
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
  }
});
