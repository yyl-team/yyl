'use strict';
var require = {
    // baseUrl: '../js',
    paths: {

        // for demo
        wDemo: '../../components/w-demo/w-demo',
        // for demo main (not cmd js)
        wDemoMain: '../../components/w-demo/main',
        // global
        jquery: '../../js/lib/jQuery/jquery-1.11.3.min'
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
