
const path = require('path');
const config = {
  entry: {
    index: './lib/index.js'
  },
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'umd',
    umdNamedDefine: true
  },
  optimization: {
    minimize: true
  },
  module:{
    rules:[
      {
        test: /\.js$/,
        loader: 'babel-loader',
        query: {
          presets: ['@babel/env']
        }
      }
    ],
  },
  mode: 'production'
};
module.exports = config;