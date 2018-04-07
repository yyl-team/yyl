import Vue from 'vue';
import getters from 'getters';
import actions from 'actions';

import './p-index.scss';
import tpl from './p-index.jade';
import vDemo from '../../widget/v-demo/v-demo.js';

export default Vue.extend({
  vuex: {
    getters,
    actions,
  },
  template: tpl(),
  components: {
    vDemo,
  },
  ready() {},
});
