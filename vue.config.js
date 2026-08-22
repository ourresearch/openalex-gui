// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const webpack = require('webpack');
// oxjob #860 (bundle diet): register only the Vuetify components/directives the
// templates actually use, instead of `import * as components` (all ~150, ~180 KB gz).
const { VuetifyPlugin } = require('webpack-plugin-vuetify');

module.exports = {
  lintOnSave: false,
  // history-mode router: serve index.html for deep links (/v2 etc.) in dev
  devServer: {
    historyApiFallback: true,
  },
  transpileDependencies: [
    'vuetify'
  ],
  productionSourceMap: true,
  configureWebpack: {
    module: {
      rules: [
        // Import .yaml files as raw source strings (parsed at runtime with the `yaml` lib).
        // Used by the jobs redline overlay (src/components/Jobs/jobs-redline.yaml).
        { test: /\.ya?ml$/, type: 'asset/source' },
      ],
    },
    //plugins: [new BundleAnalyzerPlugin()],
    devtool: process.env.NODE_ENV === 'production' 
      ? 'source-map'  // High-quality source maps for production
      : 'eval-cheap-module-source-map', // Faster source maps for development
    plugins: [
      new VuetifyPlugin({ autoImport: true }),
      new webpack.DefinePlugin({
        __VUE_OPTIONS_API__: 'true',
        __VUE_PROD_DEVTOOLS__: 'false',
        __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false',
      })
    ]
  },
}