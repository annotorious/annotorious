const path = require('path');
const fs = require('fs');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

const APP_DIR = fs.realpathSync(process.cwd());

const resolveAppPath = relativePath => path.resolve(APP_DIR, relativePath);

module.exports = {
  entry: resolveAppPath('src'),
  output: {
    filename: 'annotorious.min.js',
    library: 'Annotorious',
    libraryTarget: 'umd',
    umdNamedDefine: true
  },
  performance: {
    hints: false
  },
  optimization: {
    minimizer: [ new UglifyJsPlugin() ],
  },
  resolve: {
    extensions: ['.js', '.jsx'],
    alias: {
      "react": "preact/compat",
      "react-dom": "preact/compat",
      'preact/compat': path.resolve(__dirname, 'node_modules', 'preact', 'compat'),
      'preact/hooks': path.resolve(__dirname, 'node_modules', 'preact', 'hooks'),
    }
  },
  module: {
    rules: [
      { 
        test: /\.(js|jsx)$/, 
        use: { 
          loader: 'babel-loader' ,
          options: {
            "presets": [
              "@babel/preset-env",
              "@babel/preset-react"
            ],
            "plugins": [
              [
                "@babel/plugin-proposal-class-properties"
              ]
            ]
          }
        }
      },
      { test: /\.css$/,  use: [ 'style-loader', 'css-loader'] },
      { test: /\.scss$/, use: [ 'style-loader', 'css-loader', 'sass-loader' ] }
    ]
  },
  devServer: {
    contentBase: resolveAppPath('public'),
    compress: true,
    hot: true,
    host: process.env.HOST || 'localhost',
    port: 3000,
    publicPath: '/'
  },
  plugins: [
    new HtmlWebpackPlugin ({
      inject: 'head',
      template: resolveAppPath('public/index.html')
    })
  ]
}