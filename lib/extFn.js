const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const util = require('yyl-util');

const log = require('./log.js');
const vars = require('./vars.js');

const SUGAR_REG = /(\{\$)([a-zA-Z0-9@_\-$.~]+)(\})/g;

const extFn = {
  hideProtocol: function (str) {
    if (typeof str === 'string') {
      return str.replace(/^http[s]?:/, '');
    } else {
      return str;
    }
  }
};
module.exports = extFn;
