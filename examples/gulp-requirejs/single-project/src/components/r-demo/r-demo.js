'use strict';
define(['ajax'], function(ajax) {
    var
        wDemo = {
            init: function() {
                var logoEl = document.getElementById('logo');
                var tEl = document.getElementById('t');
                var imageUrl = __url('../r-demo/images/logo.png');
                var i;
                var iClass = [0, 1, 2, 3];

                console.log(imageUrl);

                ajax({
                    type: 'get',
                    url: '/api/mock/list/1',
                    timeOut: 5000,
                    success: function(str) {
                        var json = JSON.parse(str);
                        tEl.innerHTML = json.title;
                    },
                    error: function() {

                    }
                });

                setInterval(function() {
                    var here = iClass.concat([]);
                    here.splice(here.indexOf(i), 1);

                    i = here[Math.round(Math.random() * (here.length - 1))];
                    logoEl.className = 'w-demo-logo w-demo-logo-' + i;
                }, 2000);
            }
        };


    return wDemo;
});
