
const path = require('path');
const config = {
  entry: {
    index: './test/websocketApi-test'
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
  target: 'node',
  mode: 'production'
};
module.exports = config;