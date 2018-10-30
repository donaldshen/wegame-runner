import merge from 'webpack-merge'
import common from './webpack.common'
import webpack from 'webpack'

export default merge(common, {
  mode: 'development',
  devtool: 'cheap-module-eval-source-map',
  // @ts-ignore
  devServer: {
    contentBase: './dist',
    hot: true,
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
  ],
})
