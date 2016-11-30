'use strict';
var require = {
    // baseUrl: '../js',
    paths: {
        // for demo
        rDemo: '../js/widget/r-demo'
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
