const { resolve } = require('path');

/**
 * Webpack configuration for Orchid -- browser support
 * @type {import('webpack').Configuration}
 */
module.exports = {
  entry: './src/browser/index.js',
  resolve: {
    extensions: ['.js']
  },
  output: {
    path: resolve(__dirname, 'src'),
    filename: 'browser.js',
    library: 'orchid',
    libraryTarget: 'window'
  }
};
