import merge from 'webpack-merge'
import common from './webpack.common'
// import UglifyJSPlugin from 'uglifyjs-webpack-plugin'
import webpack from 'webpack'

export default merge(common, {
  mode: 'production',
  // devtool: 'source-map',
  plugins: [
    // new UglifyJSPlugin({
    //   sourceMap: true,
    // }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production'),
    }),
  ],
})
