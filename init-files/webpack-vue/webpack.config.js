'use strict';
var path = require('path'),
    ExtractTextPlugin = require("extract-text-webpack-plugin"),
    HtmlWebpackPlugin = require('html-webpack-plugin'),
    ManifestPlugin = require('webpack-manifest-plugin'),
    extend = require('node.extend'),
    fs = require('fs'),
    config = require('./config.js');


if(fs.existsSync('./config.mine.js')){
    config = extend(config, require('./config.mine.js'));
}

path.joinFormat = function(){
    var iArgv = Array.prototype.slice.call(arguments);
    var r = path.join.apply(path, iArgv);
    return r
        .replace(/\\+/g, '/')
        .replace(/(^http[s]?:)[\/]+/g, '$1//');
};


module.exports = {
    
    devServer:{
        host: '127.0.0.1',
        progress: true,
        colors: true,
        contentBase: config.localserver.root,
        port: 5000,
        // hot: true,
        // inline: true

    },
    entry: {
        'flexLayout': ['flexlayout'],
        'boot': './src/boot/boot.js',
        'vendors': ['flexlayout','zeptolib','yyBridge'],
    },
    output: {
        path: path.join(__dirname, config.path.jsDest),
        publicPath: path.joinFormat(
            config.localserver.path, 
            path.relative(
                path.join(
                    config.localserver.root, 
                    config.localserver.path
                ), 
                config.path.jsDest
            ), 
            '/'
        ),
        // publicPath: path.joinFormat(
        //     config.remote.hostname, 
        //     path.relative( 
        //         path.join(
        //             config.localserver.root, 
        //             config.localserver.path
        //         ), 
        //         config.path.jsDest
        //     ), 
        //     '/'
        // ),
        filename: '[name]-[chunkhash:8].js'
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
            loader: 'url?limit=10000&name=../images/[name]-[hash:8].[ext]'
        }, {
            // shiming the module
            test: path.join(__dirname, 'src/js/lib/'),
            loader: 'imports?this=>window'
        }, {
            // shiming the global module
            test: path.join(__dirname, config.path.commons, 'mobile/lib/'),
            loader: 'imports?this=>window'
        }]

    },
    resolveLoader: { 
        fallback: path.join(__dirname, "node_modules") 
    },
    resolve: {
        fallback: path.join(__dirname, "node_modules"),
        root: './',
        alias: {
            'actions': path.join(__dirname, './src/vuex/actions.js'),
            'getters': path.join(__dirname, './src/vuex/getters.js'),

            'flexlayout': path.join(__dirname, '../../../public/global/lib/flexLayout/flexLayout-1.4.0.js')
        }
    },
    devtool: 'source-map',
    plugins: [
        // 样式分离插件
        new ExtractTextPlugin("../css/boot-[chunkhash:8].css"),
        
        // html输出插件
        new HtmlWebpackPlugin({
            template: path.join(__dirname, 'src/boot/boot.jade'),
            filename: '../html/boot.html',
            minify: false
        }),
        new ManifestPlugin({
            fileName: '../assets/rev-manifest.json',
            basePath: ''
        
        })
    ]

};
