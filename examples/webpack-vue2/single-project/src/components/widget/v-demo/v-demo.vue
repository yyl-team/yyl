<template lang="jade">
div
    i.w-demo-logo(:class="['w-demo-logo-' + rotate]")
    div.w-demo-tl hello demo
</template>
<style lang="scss">
@charset 'utf-8';
@import '../../../sass/_mixin';
.w-demo-logo {
  position: absolute;
  top: 50%;
  left: 50%;
  display: block;
  width: 150px;
  height: 116px;
  margin: -58px 0 0 -75px;
  background: url('./images/logo.png') no-repeat;
  background-size: 150px 116px;
  transition: .4s;
}
.w-demo-tl {
  position: absolute;
  top: 50%;
  margin-top: 100px;
  left: 0;
  width: 100%;
  text-align: center;
  font-size: 18px; /*px*/
}
.w-demo-logo-0 {
  transform: rotate(0deg);
}
.w-demo-logo-1 {
  transform: rotate(90deg);
}
.w-demo-logo-2 {
  transform: rotate(180deg);
}
.w-demo-logo-3 {
  transform: rotate(270deg);
}

</style>
<script>

const cache = {};

export default {
  data() {
    return {
      rotate: 0,
    };
  },
  mounted() {
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
};

</script>
