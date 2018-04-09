'use strict';
const path = require('path');
const fs = require('fs');

const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const util = require('../../tasks/w-util.js');

let config;

const CONFIG_PATH = util.path.join(util.vars.SERVER_WORKFLOW_PATH, 'webpack-vue/config.js');

if (fs.existsSync(CONFIG_PATH)) {
  config = util.requireJs(CONFIG_PATH);
}


const webpackconfig = {
  entry: (function() {
    const iSrcRoot = path.isAbsolute(config.alias.srcRoot) ?
      config.alias.srcRoot :
      path.join(__dirname, config.alias.srcRoot);

    let r = {
      // 'boot': path.join(path.isAbsolute(config.alias.srcRoot)? '': __dirname, config.alias.srcRoot, 'boot/boot.js'),
    };

    // single entry
    var bootPath = path.join(iSrcRoot, 'boot/boot.js');
    if (fs.existsSync(bootPath)) {
      r.boot = bootPath;
    }

    // multi entry
    var entryPath = path.join(iSrcRoot, 'entry');

    if (fs.existsSync(entryPath)) {
      var fileList = util.readFilesSync(entryPath, /\.js$/);
      fileList.forEach((str) => {
        var key = path.basename(str).replace(/\.[^.]+$/, '');
        if (key) {
          r[key] = str;
        }
      });
    }

    // js path
    var jsPath = path.join(iSrcRoot, 'js');
    if (fs.existsSync(jsPath)) {
      var jsfiles = fs.readdirSync(jsPath);
      jsfiles.forEach((str) => {
        var filepath = path.join(jsPath, str);
        if (fs.statSync(filepath).isDirectory() || path.extname(filepath) != '.js') {
          return;
        }

        var key = path.basename(str).replace(/\.[^.]+$/, '');
        if (key) {
          r[key] = filepath;
        }
      });
    }

    // 合并 config 中的 entry 字段
    if (config.entry) {
      r = util.extend(true, r, config.entry);
    }

    return r;
  })(),
  output: {
    path: config.alias.jsDest,
    filename: '[name].js',
    publicPath: util.joinFormat(
      config.dest.basePath,
      path.relative(
        config.alias.root,
        config.alias.jsDest
      ),
      '/'
    )
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
      loaders: ['vue']
    }, {
      test: /\.html$/,
      loaders: ['html-loader']
    }, {
      test: /\.scss$/,
      loader: ExtractTextPlugin.extract('style-loader', 'css-loader!sass')
    }, {
      test: /\.jade$/,
      loaders: ['jade-loader']
    }, {
      test: /\.(png|jpg|gif)$/,
      loader: `url-loader?limit=10000&name=${  util.joinFormat(path.relative(config.alias.jsDest, path.join(config.alias.imagesDest, '[name].[ext]')))}`
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
  babel: {
    presets: ['babel-preset-es2015'].map(require.resolve)
  },
  resolveLoader: {
    fallback: path.join( __dirname, 'node_modules')
  },
  resolve: {
    fallback: path.join( __dirname, 'node_modules'),
    root: './',
    alias: util.extend({
      'actions': path.join(config.alias.srcRoot, 'vuex/actions.js'),
      'getters': path.join(config.alias.srcRoot, 'vuex/getters.js')

    }, config.alias)
  },
  plugins: [
    // 样式分离插件
    new ExtractTextPlugin( util.path.relative(config.alias.jsDest, path.join(config.alias.cssDest, '[name].css')) )
    // HtmlWebpackExcludeAssetsPlugin()
  ]
};

webpackconfig.plugins = webpackconfig.plugins.concat((function() { // html 输出
  const bootPath = util.joinFormat(config.alias.srcRoot, 'boot');
  const entryPath = util.joinFormat(config.alias.srcRoot, 'entry');
  let outputPath = [];
  const r = [];

  if (fs.existsSync(bootPath)) {
    outputPath = outputPath.concat(util.readFilesSync(bootPath, /(\.jade|\.html)$/));
  }

  if (fs.existsSync(entryPath)) {
    outputPath = outputPath.concat(util.readFilesSync(entryPath, /(\.jade|\.html)$/));
  }


  var entrys = [];

  for (var key in webpackconfig.entry) {
    if (webpackconfig.entry.hasOwnProperty(key)) {
      entrys.push(key);
    }
  }

  outputPath.forEach((iPath) => {
    var iBaseName = path.basename(iPath).replace(/(\.jade|\.html)$/, '');
    var iExclude = [].concat(entrys);
    var fPath;


    for (var i = 0; i < iExclude.length;) {
      if (util.type(iExclude[i]) == 'array') {
        i++;
      } else {
        fPath = webpackconfig.entry[iExclude[i]];
        if (util.type(fPath) == 'array') {
          fPath = fPath[0];
        }
        if (webpackconfig.resolve.alias[fPath]) {
          fPath = webpackconfig.resolve.alias[fPath];
        }
        fPath = util.joinFormat(fPath);

        if (
          iExclude[i] == iBaseName ||
          (
            fPath.substr(0, entryPath.length) != entryPath &&
            fPath.substr(0, bootPath.length) != bootPath
          )
        ) {
          iExclude.splice(i, 1);
        } else {
          i++;
        }
      }
    }



    r.push(new HtmlWebpackPlugin({
      template: iPath,
      filename: path.relative(config.alias.jsDest, path.join(config.alias.htmlDest, `${iBaseName  }.html`)),
      excludeChunks: iExclude,
      minify: false
    }));
  });


  return r;
})());

module.exports = webpackconfig;
