const path = require('path');

const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const HTMLInlineCSSWebpackPlugin = require("html-inline-css-webpack-plugin").default;
const HTMLInlineScriptWebpackPlugin = require("html-inline-script-webpack-plugin");
const HTMLWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {

  entry: './src/app.ts',

  mode: 'none',

  module: {
    rules: [
      { test: /\.ts$/i, use: 'ts-loader', exclude: /node_modules/ },
      { test: /\.css$/i, use: [MiniCssExtractPlugin.loader, 'css-loader'] },
      { test: /\.html$/i, use: 'html-loader' },
    ]
  },

  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.css', '.html'],
  },

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '',
  },

  plugins: [
    new MiniCssExtractPlugin(),
    new HTMLWebpackPlugin({
      template: 'src/index.html',
      filename: 'gamma-spectrosim.html',
      minify: {
        collapseWhitespace: true,
        keepClosingSlash: true,
        removeComments: false,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true,
      },
    }),
    new HTMLInlineCSSWebpackPlugin(),
    new HTMLInlineScriptWebpackPlugin(),
  ],

  optimization: {
    minimize: true,
    minimizer: [
      new CssMinimizerPlugin(),
      new TerserPlugin({ extractComments: false, }), ],
  }
}
