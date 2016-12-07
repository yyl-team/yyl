'use strict';
var require = {
    // baseUrl: '../js',
    paths: {

        // for demo
        rDemo: '../../../../../../../public/plugin/pc/r-demo/r-demo',
        // global
        jquery: '../../../../../../../public/global/lib/jQuery/jquery-1.11.1'
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
