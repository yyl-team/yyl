const webpackMerge = require('webpack-merge');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const uglifyjsWebpackPlugin = require('uglifyjs-webpack-plugin');
const autoprefixer = require('autoprefixer');
const path = require('path');
const fs = require('fs');
const px2rem = require('postcss-px2rem');

const webpackBase = require('./webpack.config.base.js');
const util = require('../../../tasks/w-util.js');
let config;

const CONFIG_PATH = util.path.join(util.vars.SERVER_WORKFLOW_PATH, 'webpack-vue2/config.js');
if (fs.existsSync(CONFIG_PATH)) {
  config = util.requireJs(CONFIG_PATH);
}

const webpackConfig = {
  output: {
    publicPath: util.joinFormat(
      config.commit.hostname,
      webpackBase.output.publicPath
    )
  },
  module: {
    rules: [{
      test: /\.css$/,
      use: ExtractTextPlugin.extract({
        fallback: 'style-loader',
        use: [
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              ident: 'postcss',
              plugins: () => config.platform == 'pc'? [
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
          }
        ]
      })
    }, {
      test: /\.(scss|sass)$/,
      use: ExtractTextPlugin.extract({
        fallback: 'style-loader',
        use: [
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              ident: 'postcss',
              plugins: () => config.platform == 'pc'? [
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
          },
          'sass-loader'
        ]
      })
    }]
  },
  plugins: [
    new uglifyjsWebpackPlugin(),
    // 样式分离插件
    new ExtractTextPlugin({
      filename: util.joinFormat(
        path.relative(
          config.alias.jsDest,
          path.join(config.alias.cssDest, '[name].css')
        )
      ),
      allChunks: true
    })
  ]
};
console.log(22222222222221212)
module.exports = webpackMerge(webpackBase, webpackConfig);

