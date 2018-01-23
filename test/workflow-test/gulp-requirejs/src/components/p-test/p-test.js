'use strict';
require(['artTemplate'], function(artTemplate) {
    var cntEl = document.getElementById('tmplCnt');
    cntEl.innerHTML = artTemplate('tmpl', {
        url: '//yyweb.yystatic.com/pc/images/components/w-head/images/icons-head.png'
    });
    window.hello();
});