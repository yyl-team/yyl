'use strict';
var 
    path = require('path'),
    setting = {
        localserver: {
            root: './dist',
            path: '/mobileYY/mobile_yy_rp',
            commons: '../commons',
	    revRoot: './dist'
        },
        remote: {
            hostname: 'http://s1.yy.com/website_static/',
        }

    },
    config = {
        localserver: setting.localserver,
        remote: setting.remote,
        alias: {
            trunk: path.join('../../../svn.yy.com/yy-music/web/publish/src/3g/mobile-website-static/trunk', setting.localserver.path),
            release: path.join('../../../svn.yy.com/yy-music/web/publish/src/3g/mobile-website-static/branches/release', setting.localserver.path),
            root: path.join(setting.localserver.root, setting.localserver.path),
            commons: setting.localserver.commons,

        },
        path: {
            commons: setting.localserver.commons,
            root: path.join(setting.localserver.root, setting.localserver.path),
            dest: path.join(setting.localserver.root, setting.localserver.path),
            rev: path.join(setting.localserver.root, setting.localserver.path, 'assets/rev-manifest.json'),
            jsDest: path.join(setting.localserver.root, setting.localserver.path, 'js')
        },
        commit: {
            trunk: {
                revAddr: 'http://s1.yy.com/website_static/mobileYY/mobile_yy_rp/assets/rev-manifest.json',
                // versionFile: '{$trunk}/WEB-INF/views/h5/play_modules.jsp',
                git: {
                    update: [
                        '{$commons}'
                    ]
                },
                svn: {
                    update: [
                        '{$trunk}'
                    ],
                    copy: {
                        '{$root}': [
                            '{$trunk}'
                        ]
                    },
                    commit: [
                        '{$trunk}/js',
                        '{$trunk}/css',
                        '{$trunk}/html',
                        '{$trunk}/images',
                        '{$trunk}/assets'
                    ]
                }
            },
            release: {
                revAddr: 'http://s1.yy.com/website_static/mobileYY/mobile_yy_rp/assets/rev-manifest.json',
                // versionFile: '{$release}/WEB-INF/views/h5/play_modules.jsp',
                git: {
                    update: [
                        '{$commons}'
                    ]
                },
                svn: {
                    update: [
                        '{$release}'
                    ],
                    copy: {
                        '{$root}': [
                            '{$release}'
                        ]
                    },
                    commit: [
                        '{$release}/js',
                        '{$release}/css',
                        '{$release}/html',
                        '{$release}/images',
                        '{$release}/assets'
                    ]
                }
            }
        }
    };

module.exports = config;
