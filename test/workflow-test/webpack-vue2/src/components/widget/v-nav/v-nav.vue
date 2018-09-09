<style lang="scss">
.nav {
  background: #333;
  display: block;
  height: 45px;
  a {
    display: inline-block;
    vertical-align: top;
    font-size: 20px;
    height: 45px;
    line-height: 45px;
    padding: 0 10px;
    text-decoration: none;
    color: #fff;
    &.current {
      background: #ffdd00;
      color: #333;
    }
  }
}
</style>

<template lang="pug">
  div.nav
    router-link(active-class="current", to="/index") index
    router-link(active-class="current", to="/sub") sub
</template>

<script>
export default {
};
</script>
