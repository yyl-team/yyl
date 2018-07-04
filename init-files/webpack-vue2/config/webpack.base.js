'use strict';
const path = require('path');
const fs = require('fs');
const combine = require('webpack-combine-loaders');
const autoprefixer = require('autoprefixer');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const px2rem = require('postcss-px2rem');
const eslintFriendlyFormatter = require('eslint-friendly-formatter');

const util = require('../../../tasks/w-util.js');
let config;


const CONFIG_PATH = util.path.join(util.vars.SERVER_WORKFLOW_PATH, 'webpack-vue2/config.js');

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

    // 合并 config 中的 entry 字段
    if (config.entry) {
      r = util.extend(true, r, config.entry);
    }

    return r;
  })(),
  output: {
    path: path.resolve(__dirname, config.alias.jsDest),
    filename: '[name].js',
    chunkFilename: `async_component/[name]${config.disableHash? '' : '-[chunkhash:8]'}.js`
  },
  module: {
    rules: [{
      test: /\.js$/,
      exclude: /node_modules/,
      use: [{
        loader: 'babel-loader',
        query: {
          babelrc: false,
          cacheDirectory: true,
          presets: [
            'babel-preset-es2015',
            'babel-preset-stage-2'
          ].map(require.resolve)
        }
      }]
    }, {
      test: /\.vue$/,
      loader: 'vue-loader',
      options: {
        loaders: {
          js: combine([{
            loader: 'babel-loader',
            query: {
              babelrc: false,
              cacheDirectory: true,
              presets: [
                'babel-preset-es2015',
                'babel-preset-stage-2'
              ].map(require.resolve)
            }
          }])
        },
        postcss: config.platform == 'pc'? [
          autoprefixer({
            browsers: ['> 1%', 'last 2 versions']
          })
        ] : [
          autoprefixer({
            browsers: ['iOS >= 7', 'Android >= 4']
          }),
          px2rem({remUnit: 75})
        ]
      }
    }, {
      test: /\.html$/,
      use: [{
        loader: 'html-loader'
      }]
    }, {
      test: /\.pug$/,
      loaders: ['pug-loader']
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
              path.join(config.alias.imagesDest, '[name].[ext]')
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
    modules: [path.join( __dirname, '../node_modules'), __dirname]
  },
  resolve: {
    modules: [
      __dirname,
      path.join(__dirname, '../node_modules')
    ],
    alias: util.extend({
      'actions': path.join(config.alias.srcRoot, 'vuex/actions.js'),
      'getters': path.join(config.alias.srcRoot, 'vuex/getters.js'),
      'vue$': 'vue/dist/vue.common.js'
    }, config.alias)
  },
  plugins: []
};

// html output
webpackconfig.plugins = webpackconfig.plugins.concat((function() { // html 输出
  const bootPath = util.joinFormat(config.alias.srcRoot, 'boot');
  const entryPath = util.joinFormat(config.alias.srcRoot, 'entry');
  let outputPath = [];
  const r = [];

  if (fs.existsSync(bootPath)) {
    outputPath = outputPath.concat(util.readFilesSync(bootPath, /(\.jade|\.pug|\.html)$/));
  }

  if (fs.existsSync(entryPath)) {
    outputPath = outputPath.concat(util.readFilesSync(entryPath, /(\.jade|\.pug|\.html)$/));
  }


  var entrys = [];

  for (var key in webpackconfig.entry) {
    if (webpackconfig.entry.hasOwnProperty(key)) {
      entrys.push(key);
    }
  }

  outputPath.forEach((iPath) => {
    var iBaseName = path.basename(iPath).replace(/(\.jade|.pug|\.html)$/, '');
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
      filename: path.relative(config.alias.jsDest, path.join(config.alias.htmlDest, `${iBaseName}.html`)),
      excludeChunks: iExclude,
      inlineSource: '.(js|css)\\?__inline$',
      minify: false
    }));
  });

  return r;
})());

// eslint
if (config.eslint) {
  webpackconfig.module.rules.push({
    enforce: 'pre',
    test: /\.js$/,
    exclude: /node_modules/,
    loader: 'eslint-loader',
    options: {
      eslintPath: 'eslint',
      formatter: eslintFriendlyFormatter
    }
  });
}

// config.module 继承
const userConfigPath = util.path.join(config.alias.dirname, 'config.js');
if (fs.existsSync(userConfigPath)) {
  const userConfig = util.requireJs(userConfigPath);
  if (userConfig.moduleRules) {
    webpackconfig.module.rules = webpackconfig.module.rules.concat(userConfig.moduleRules);
  }
}

module.exports = webpackconfig;

