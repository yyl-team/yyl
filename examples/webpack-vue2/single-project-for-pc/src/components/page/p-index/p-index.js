import Vue from 'vue';
import { mapGetters, mapActions } from 'vuex';

import tpl from './p-index.pug';
import './p-index.scss';
import vDemo from '../../widget/v-demo/v-demo.vue';

export default Vue.extend({
  template: tpl(),
  methods: {
    ...mapActions(['addDemoLog'])
  },
  computed: {
    ...mapGetters(['demoLogs'])
  },
  data() {
    return {
    };
  },
  components: {
    vDemo
  },
  mounted() {
    const vm = this;
    vm.addDemoLog('p-index is ready');
  }
});
