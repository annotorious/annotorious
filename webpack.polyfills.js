const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  entry: './src/polyfills/index.js',
  output: {
    filename: 'recogito-polyfills.js'
  },
  performance: {
    hints: false
  },
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin()]
  },
  resolve: {
    extensions: ['.js']
  },
  module: {
    rules: [
      { 
        test: /\.js$/, 
        use: { 
          loader: 'babel-loader' ,
          options: {
            "presets": [
              "@babel/preset-env",
            ],
            "plugins": [
              [
                "@babel/plugin-proposal-class-properties"
              ]
            ]
          }
        }
      }
    ]
  }
}