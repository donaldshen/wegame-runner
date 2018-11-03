const merge = require('webpack-merge')
const common = require('./webpack.common')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = merge(common, {
  mode: 'development',
  devtool: 'cheap-module-eval-source-map',
  // @ts-ignore
  devServer: {
    contentBase: './dist',
    hot: true,
  },
  plugins: [
    // NOTE: 没有这个plugin则热替换不能工作
    new HtmlWebpackPlugin({
      template: 'index.html',
    }),
    new webpack.HotModuleReplacementPlugin(),
  ],
})
