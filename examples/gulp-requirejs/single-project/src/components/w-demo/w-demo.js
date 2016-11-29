'use strict';
define(['jquery', 'wDemoMain'], function(jquery, wDemoMain){
    var 
        wDemo = {
            init: function(){
                var logoEl = document.getElementById('logo');

                var i = 0;
                setInterval(function(){
                    logoEl.className = 'w-demo-logo w-demo-logo-' + (i++ % 3);



                }, 1);


            }
        };


    return wDemo;
});
