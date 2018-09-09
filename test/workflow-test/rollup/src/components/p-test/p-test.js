'use strict';
import artTemplate from 'artTemplate';
var cntEl = document.getElementById('tmplCnt');
cntEl.innerHTML = artTemplate('tmpl', {
    url: '//yyweb.yystatic.com/pc/images/components/w-head/images/icons-head.png'
});