'use strict';
var path = require('path'),
    ExtractTextPlugin = require("extract-text-webpack-plugin"),
    HtmlWebpackPlugin = require('html-webpack-plugin'),
    ManifestPlugin = require('webpack-manifest-plugin'),
    util = require('yyl-util'),
    fs = require('fs'),
    config = require('./config.js');


if(fs.existsSync('./config.mine.js')){
    config = util.extend(true, config, require('./config.mine.js'));
}




var webpackconfig = {
    entry: (function(){

        var iSrcRoot = path.isAbsolute(config.alias.srcRoot)? config.alias.srcRoot: path.join(__dirname, config.alias.srcRoot);
        var 
            r = {
                // 'boot': path.join(path.isAbsolute(config.alias.srcRoot)? '': __dirname, config.alias.srcRoot, 'boot/boot.js'),
            };


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

        // 合并 config 中的 entry 字段
        if(config.entry){
            r = util.extend(true, r, config.entry);
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
        
        rules: [{
            test: /\.js$/,
            exclude: '/node_modules/',
            loader: 'babel-loader',
            query: {
                babelrc: false,
                presets: [
                    'babel-preset-es2015'
                    // 'babel-preset-stage-0'
                ].map(require.resolve)
                
            }

        }, {
            test: /\.vue$/,
            loader: 'vue-loader',
            options: {
                loaders: {
                    'scss': 'vue-style-loader!css-loader!sass-loader',
                    'sass': 'vue-style-loader!css-loader!sass-loader',
                    'js': 'babel-loader?babelrc=false&presets[]=' + [
                        'babel-preset-es2015',
                        // 'babel-preset-stage-0'
                    ].map(require.resolve)
                }

            }
            
        }, {
            test: /\.html$/,
            loaders: ['html-loader']
        }, {
            test: /\.scss$/,
            use: ExtractTextPlugin.extract({
                fallback: 'style-loader',
                use: ["css-loader", "sass-loader"]
            })
        }, {
            test: /\.jade$/,
            loaders: ['pug-loader']
        }, {
            test: /\.(png|jpg|gif)$/,
            use: {
                loader: 'url-loader',
                options: {
                    limit: 10000,
                    name: util.joinFormat(
                        path.relative(
                            config.alias.jsDest, 
                            path.join(config.alias.imagesDest, '[name]-[hash:8].[ext]')
                        )
                    )
                }
            }
            
        }, {
            // shiming the module
            test: path.join(config.alias.srcRoot, 'js/lib/'),
            use: {
                loader: 'imports-loader?this=>window'
            }
        }, {
            // shiming the global module
            test: path.join(config.alias.commons, 'lib'),
            use: {
                loader: 'imports-loader?this=>window'
            }
        }]

    },
    resolveLoader: { 
        modules: [path.join( __dirname, "node_modules"), __dirname]
    },
    resolve: {
        modules: [
            __dirname,
            path.join(__dirname, "node_modules")
        ],
        alias: util.extend({
            'actions': path.join(config.alias.srcRoot, 'vuex/actions.js'),
            'getters': path.join(config.alias.srcRoot, 'vuex/getters.js'),
            'vue$': 'vue/dist/vue.common.js'

        }, config.alias)

    },
    plugins: [
        // 样式分离插件
        new ExtractTextPlugin({
            filename: util.joinFormat(
                path.relative(
                    config.alias.jsDest, 
                    path.join(config.alias.cssDest, "[name]-[chunkhash:8].css")
                )
            )
        })
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
