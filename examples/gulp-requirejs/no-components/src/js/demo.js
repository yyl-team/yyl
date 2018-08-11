/*amd: disabled*/
'use strict';
(function() {
    var wDemo = {
        init: function() {
            var logoEl = document.getElementById('logo');
            var i;
            var iClass = [0, 1, 2, 3];

            setInterval(function(){
                var here = iClass.concat([]);
                here.splice(here.indexOf(i), 1);

                i = here[Math.round(Math.random() * (here.length - 1))];
                logoEl.className = 'w-demo-logo w-demo-logo-' + i;
            }, 2000);
        }
    };
    wDemo.init();
})();
