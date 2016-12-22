'use strict';
var path = require('path');

module.exports = {
    alias: {
        

        // svn dev 分支地址
        dev: path.join('../../../../../../svn.yy.com/yy-music/static/project/workflow_demo/branches/develop/pc'),
        // svn commit 分支地址
        commit: path.join('../../../../../../svn.yy.com/yy-music/static/project/workflow_demo/branches/commit/pc'),
        // svn trunk 分支地址
        trunk: path.join('../../../../../../svn.yy.com/yy-music/static/project/workflow_demo/trunk/pc')
    }
};
