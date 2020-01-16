<template lang="pug">
div.p-sub
  components(is="vNav")
  components(is="vDemo")
</template>
<style lang="scss">
@charset 'utf-8';
.p-sub {
  background: #ddd;
  height: 100%;
}
</style>
<script>
import Vue from 'vue';
import { mapGetters, mapActions } from 'vuex';

import vDemo from '../../widget/v-demo/v-demo.vue';
import vNav from '../../widget/v-nav/v-nav.vue';

export default Vue.extend({
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
</script>
