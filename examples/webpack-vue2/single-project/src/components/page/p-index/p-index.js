'use strict';
import Vue from 'vue';
import tpl from './p-index.jade';
import './p-index.scss';

import vDemo from '../../widget/v-demo/v-demo.js';

export default Vue.extend({
    template: tpl(),
    data(){
        return {
        };
    },
    components: {
        vDemo
    },
    mounted(){

    }
});
