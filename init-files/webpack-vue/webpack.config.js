'use strict';
var path = require('path'),
    ExtractTextPlugin = require("extract-text-webpack-plugin"),
    HtmlWebpackPlugin = require('html-webpack-plugin'),
    ManifestPlugin = require('webpack-manifest-plugin'),
    util = require('../../lib/yyl-util.js'),
    fs = require('fs'),
    config = require('./config.js');


if(fs.existsSync('./config.mine.js')){
    config = util.extend(true, config, require('./config.mine.js'));
}



module.exports = {
    entry: {
        'flexLayout': ['flexlayout'],
        'boot': path.join(config.alias.srcRoot, 'boot/boot.js'),
    },
    output: {
        path: config.alias.jsDest,
        filename: '[name]-[chunkhash:8].js',
        publicPath: util.joinFormat(
            config.dest.basePath, 
            path.relative(
                config.alias.root,
                config.alias.jsDest
            ), 
            '/'
        ),
    },
    module: {
        loaders: [{
            test: /\.js$/,
            exclude: '/node_modules/',
            loader: 'babel-loader'

        }, {
            test: /\.vue$/,
            loaders: ['vue']
        }, {
            test: /\.scss$/,
            loader: ExtractTextPlugin.extract("style-loader", "css!sass")
        }, {
            test: /\.jade$/,
            loaders: ['jade-loader']
        }, {
            test: /\.(png|jpg|gif)$/,
            loader: 'url?limit=10000&name=' + util.joinFormat(path.relative(config.alias.jsDest, path.join(config.alias.imagesDest, '[name]-[hash:8].[ext]')))
        }, {
            // shiming the module
            test: path.join(config.alias.srcRoot, 'js/lib/'),
            loader: 'imports?this=>window'
        }, {
            // shiming the global module
            test: path.join(config.alias.commons, 'lib'),
            loader: 'imports?this=>window'
        }]

    },
    resolveLoader: { 
        fallback: path.join( config.alias.dirname, "node_modules") 
    },
    resolve: {
        fallback: path.join( config.alias.dirname, "node_modules"),
        root: './',
        alias: {
            'actions': path.join(config.alias.srcRoot, 'vuex/actions.js'),
            'getters': path.join(config.alias.srcRoot, 'vuex/getters.js'),
            'flexlayout': path.join(config.alias.srcRoot, 'js/lib/flexLayout/flexLayout-1.4.0.js')
        }
    },
    plugins: [
        // 样式分离插件
        new ExtractTextPlugin(path.relative(config.alias.jsDest, path.join(config.alias.cssDest, "boot-[chunkhash:8].css"))),

        // html输出插件
        new HtmlWebpackPlugin({
            template: path.join( config.alias.srcRoot, 'boot/boot.jade'),
            filename: path.relative(config.alias.jsDest, path.join(config.alias.htmlDest, 'boot.html')),
            minify: false
        }),

        new ManifestPlugin({
            fileName: path.relative(config.alias.jsDest, path.join(config.alias.revDest, 'rev-manifest.json')),
            basePath: ''
        })
    ]

};
