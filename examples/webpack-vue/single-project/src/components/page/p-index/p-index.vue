<template lang="jade">
  components(is="vDemo")
</template>
<script>
import getters from 'getters';
import actions from 'actions';
import vDemo from '../../widget/v-demo/v-demo.js';

export default {
  vuex: {
    getters,
    actions,
  },
  components: {
    vDemo,
  },
  ready() {
  },
};
</script>
