import Vue from 'vue';
import { mapGetters, mapActions } from 'vuex';

import tpl from './p-sub.pug';
import './p-sub.scss';
import vDemo from '../../widget/v-demo/v-demo.vue';
import vNav from '../../widget/v-nav/v-nav.vue';

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
    vDemo,
    vNav
  },
  mounted() {
    const vm = this;
    vm.addDemoLog('p-sub is ready');
  }
});
