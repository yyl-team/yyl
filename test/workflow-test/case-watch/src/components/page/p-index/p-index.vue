<template lang="pug">
div.p-index
  components(is="vNav")
  components(is="vDemo")
</template>
<style lang="scss">
@charset 'utf-8';
.p-index {
  height: 100%;
  background: #fff;
}
</style>
<script>
import { mapGetters, mapActions } from 'vuex';

import vDemo from '../../widget/v-demo/v-demo.vue';
import vNav from '../../widget/v-nav/v-nav.vue';

export default {
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
    vm.addDemoLog('p-index is ready');
    vm.addDemoLog(`now in ${process.env.NODE_ENV}`);
  }
};
</script>
