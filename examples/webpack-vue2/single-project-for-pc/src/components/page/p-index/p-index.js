import Vue from 'vue';

import tpl from './p-index.pug';
import './p-index.scss';
import vDemo from '../../widget/v-demo/v-demo.vue';

export default Vue.extend({
  'template': tpl(),
  data() {
    return {
    };
  },
  'components': {
    vDemo
  },
  mounted() {

  }
});
