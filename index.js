'use strict';
module.exports = {
    commit: require('./tasks/w-commit.js'),
    init: require('./tasks/w-init.js'),
    optimize: require('./tasks/w-optimize.js'),
    remove: require('./tasks/w-remove.js'),
    server: require('./tasks/w-server.js'),
    test: require('./tasks/w-test.js'),
    version: require('./tasks/w-version.js')
};
