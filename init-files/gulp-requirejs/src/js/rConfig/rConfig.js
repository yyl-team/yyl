'use strict';
var require = {
    // baseUrl: '../js',
    paths: {

        // for demo
        wDemo: '../../components/w-demo/w-demo',
        // for demo main (not cmd js)
        wDemoMain: '../../components/w-demo/main',
        // global
        util: '../../../../commons/pc/lib/util/1.0.0/util',
        jquery: '../../../../commons/pc/lib/jQuery/jquery-1.11.1'
    },
    shim: {
        // artTemplate: {
        //     exports: 'artTemplate'
        // }
    }
};

if(typeof module === "object" && typeof module.exports === 'object'){
    module.exports = require;
}
