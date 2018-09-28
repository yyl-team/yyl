define([], function() {
    var widget = {
        init: function() {
            var el = document.getElementById('tDemo');
            var i = 0;
            setInterval(function() {
                el.innerHTML = ++i;
            }, 1000);
        }
    };
    return widget;
});
