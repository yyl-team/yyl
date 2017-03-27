'use strict';
var path = require('path'),
    ExtractTextPlugin = require("extract-text-webpack-plugin"),
    HtmlWebpackPlugin = require('html-webpack-plugin'),
    // HtmlWebpackExcludeAssetsPlugin = require('html-webpack-exclude-assets-plugin'),
    ManifestPlugin = require('webpack-manifest-plugin'),
    util = require('yyl-util'),
    fs = require('fs'),
    config = require('./config.js');


if(fs.existsSync('./config.mine.js')){
    config = util.extend(true, config, require('./config.mine.js'));
}




var webpackconfig = {
    entry: (function(){ // 未完成

        var iSrcRoot = path.isAbsolute(config.alias.srcRoot)? config.alias.srcRoot: path.join(__dirname, config.alias.srcRoot);
        var 
            r = {
                // 'boot': path.join(path.isAbsolute(config.alias.srcRoot)? '': __dirname, config.alias.srcRoot, 'boot/boot.js'),
            };

        if(config.alias.flexlayout){
            r.flexLayout = ['flexlayout'];
        }

        // single entry
        var bootPath = path.join(iSrcRoot, 'boot/boot.js');
        if(fs.existsSync(bootPath)){
            r.boot = bootPath;
        }

        // multi entry
        var entryPath = path.join(iSrcRoot, 'entry');

        if(fs.existsSync(entryPath)){
            var fileList = util.readFilesSync(entryPath, /\.js$/);
            fileList.forEach(function(str){
                var key = path.basename(str).replace(/\.[^.]+$/, '');
                if(key){
                    r[key] = str;
                }
            });
        }

        // js path
        var jsPath = path.join(iSrcRoot, 'js');
        if(fs.existsSync(jsPath)){
            var jsfiles = fs.readdirSync(jsPath);
            jsfiles.forEach(function(str){
                var filepath = path.join(jsPath, str);
                if(fs.statSync(filepath).isDirectory() || path.extname(filepath) != '.js'){
                    return;
                }

                var key = path.basename(str).replace(/\.[^.]+$/, '');
                if(key){
                    r[key] = filepath;
                }
            });

        }

        return r;

    })(),
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
            loader: 'babel-loader',
            query: {
                presets: ['babel-preset-es2015'].map(require.resolve)
            }

        }, {
            test: /\.vue$/,
            loader: 'vue-loader'
        }, {
            test: /\.html$/,
            loaders: ['html-loader']
        }, {
            test: /\.scss$/,
            loader: ExtractTextPlugin.extract("style-loader", "css!sass")
        }, {
            test: /\.jade$/,
            loaders: ['pug-loader']
        }, {
            test: /\.(png|jpg|gif)$/,
            loader: 'url-loader?limit=10000&name=' + util.joinFormat(path.relative(config.alias.jsDest, path.join(config.alias.imagesDest, '[name]-[hash:8].[ext]')))
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
        fallback: path.join( __dirname, "node_modules") 
    },
    resolve: {
        fallback: path.join( __dirname, "node_modules"),
        root: './',
        alias: util.extend({
            'actions': path.join(config.alias.srcRoot, 'vuex/actions.js'),
            'getters': path.join(config.alias.srcRoot, 'vuex/getters.js'),
            'vue$': 'vue/dist/vue.common.js'

        }, config.alias)

    },
    plugins: [
        // 样式分离插件
        new ExtractTextPlugin( util.joinFormat(path.relative(config.alias.jsDest, path.join(config.alias.cssDest, "[name]-[chunkhash:8].css"))))
        // HtmlWebpackExcludeAssetsPlugin()
    ]
};

if(config.commit.revAddr){
    webpackconfig.plugins.push(new ManifestPlugin({
        fileName: path.relative(config.alias.jsDest, path.join(config.alias.revDest, 'rev-manifest.json')),
        basePath: ''
    }));
}

webpackconfig.plugins = webpackconfig.plugins.concat((function(){ // html 输出
    var 
        bootPath = util.joinFormat(config.alias.srcRoot, 'boot'),
        entryPath = util.joinFormat(config.alias.srcRoot, 'entry'),
        outputPath = [],
        r = [];

    if(fs.existsSync(bootPath)){
        outputPath = outputPath.concat(util.readFilesSync(bootPath, /(\.jade|\.html)$/));
    }

    if(fs.existsSync(entryPath)){
        outputPath = outputPath.concat(util.readFilesSync(entryPath, /(\.jade|\.html)$/));
    }


    var entrys = [];

    for(var key in webpackconfig.entry){
        if(webpackconfig.entry.hasOwnProperty(key)){
            entrys.push(key);
        }
    }

    outputPath.forEach(function(iPath){
        var iBaseName = path.basename(iPath).replace(/(\.jade|\.html)$/, '');
        var iExclude = [].concat(entrys);
        var fPath;


        for(var i = 0; i < iExclude.length;){
            if(util.type(iExclude[i]) == 'array'){
                i++;

            } else {
                fPath = webpackconfig.entry[iExclude[i]];
                if(util.type(fPath) == 'array'){
                    fPath = fPath[0];
                }
                if(webpackconfig.resolve.alias[fPath]){
                    fPath = webpackconfig.resolve.alias[fPath];
                }
                fPath = util.joinFormat(fPath);
                
                if(iExclude[i] == iBaseName || (fPath.substr(0, entryPath.length) != entryPath && fPath.substr(0, bootPath.length) != bootPath)){
                    iExclude.splice(i, 1);
                } else {
                    i++;
                }

            }
        }



        r.push(new HtmlWebpackPlugin({
            template: iPath,
            filename: path.relative(config.alias.jsDest, path.join(config.alias.htmlDest, iBaseName + '.html')),
            excludeChunks: iExclude,
            minify: false
        }));
    });


    return r;

})());

module.exports = webpackconfig;
