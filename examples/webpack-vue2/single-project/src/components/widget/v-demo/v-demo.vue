<template lang="jade">
div
    i.w-demo-logo(:class="['w-demo-logo-' + rotate]")
    div.w-demo-tl hello demo
</template>
<style lang="scss">
@charset 'utf-8';
@import '../../../sass/_mixin';
$psdWidth: 750;

.w-demo-logo {
    position: absolute;
    top: 50%;
    left: 50%;
    display: block;
    width: rem(150);
    height: rem(116);
    margin: rem(-58) 0 0 rem(-75);
    background: url('./images/logo.png') no-repeat;
    background-size: rem(150) rem(116);
    -webkit-transition: .4s;
}
.w-demo-tl {
    position: absolute;
    top: 50%;
    margin-top: rem(100);
    left: 0;
    width: 100%;
    text-align: center;
    @include dpr(font-size, 18px);
}
.w-demo-logo-0 {
    @include attr2all(transform, rotate(0deg));
}
.w-demo-logo-1 {
    @include attr2all(transform, rotate(90deg));
}
.w-demo-logo-2 {
    @include attr2all(transform, rotate(180deg));
}
.w-demo-logo-3 {
    @include attr2all(transform, rotate(270deg));
}

</style>
<script>
'use strict';
import Vue from 'vue';
import tpl from './v-demo.jade';
import './v-demo.scss';

import vDemo from '../../widget/v-demo/v-demo.js';
var cache = {};

export default Vue.extend({
    data(){
        return {
            rotate: 0
        };
    },
    components: {
        vDemo
    },
    mounted(){
        var vm = this;

        var i;
        var iClass = [0, 1, 2, 3];

        cache.changeKey = setInterval(function(){
            var here = iClass.concat([]);
            here.splice(here.indexOf(i), 1);

            vm.$data.rotate = here[Math.round(Math.random() * (here.length - 1))];
        }, 2000);

    },
    beforeDestroy(){
        clearInterval(cache.changeKey);
    }
});

</script>
