module.exports = {
  lintOnSave: false,
  transpileDependencies: [
    'vuetify'
  ],
  productionSourceMap: true,
  configureWebpack: {
    devtool: process.env.NODE_ENV === 'production' 
      ? 'source-map'  // High-quality source maps for production
      : 'eval-cheap-module-source-map' // Faster source maps for development
  },
}
