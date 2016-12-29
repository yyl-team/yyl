'use strict';
module.exports = {
    module: {
        loaders: [{
            test: /\.scss$/,
            loader: "style!css!sass"
        }, {
            test: /\.(png|jpg|gif)$/,
            loader: 'url?name=/../images/[name]-[hash:8].[ext]'
        }]
    }
};
