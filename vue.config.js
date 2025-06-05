// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const webpack = require('webpack');

module.exports = {
  lintOnSave: false,
  transpileDependencies: [
    'vuetify'
  ],
  productionSourceMap: true,
  configureWebpack: {
    //plugins: [new BundleAnalyzerPlugin()],
    devtool: process.env.NODE_ENV === 'production' 
      ? 'source-map'  // High-quality source maps for production
      : 'eval-cheap-module-source-map', // Faster source maps for development
    plugins: [
      new webpack.DefinePlugin({
        __VUE_OPTIONS_API__: 'true',
        __VUE_PROD_DEVTOOLS__: 'false',
        __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false',
      })
    ]
  },
}