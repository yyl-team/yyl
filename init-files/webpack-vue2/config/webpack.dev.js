const webpackMerge = require('webpack-merge');
const webpack = require('webpack');
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
      config.dest.basePath,
      path.relative(
        config.alias.root,
        config.alias.jsDest
      ),
      '/'
    )
  },
  module: {
    rules: [{
      test: /\.css$/,
      use: [
        'style-loader',
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
    }, {
      test: /\.(scss|sass)$/,
      use: [
        'style-loader',
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
    }]
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('development')
    })
  ]
};

console.log(66666666666666666)
module.exports = webpackMerge(webpackBase, webpackConfig);


