const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'looker_ui_table.js',
    path: path.resolve(__dirname),
    libraryTarget: 'umd',
    globalObject: 'this'
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', { targets: "defaults" }],
              '@babel/preset-react'
            ]
          }
        }
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx']
  },
  externals: {
    // If Looker registers some globals we don't want to bundle, we can specify them here,
    // but since we want to be fully self-contained (no CDN dependencies), we bundle React and Looker Components.
  }
};
