'use strict';
var util = require('yyl-util');

util.msg.init({
    maxSize: 8,
    type: {
        update: {name: 'Updated', color: 'cyan'}
    }
});

module.exports = util;
