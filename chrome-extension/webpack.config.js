const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const glob = require('glob');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  // エントリーポイントを動的に取得
  const entries = glob.sync('./src/**/*.js').reduce((acc, file) => {
    const name = path.relative('./src', file).replace(/\.js$/, '');
    acc[name] = './' + file;
    return acc;
  }, {});

  return {
    entry: entries,
    output: {
      filename: '[name].bundle.js', // [name]にはディレクトリパスが含まれる
      path: path.resolve(__dirname, 'dist'),
      clean: true
    },
    mode: isProduction ? 'production' : 'development',
    devtool: isProduction ? false : 'source-map',
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env'],
              plugins: ['@babel/plugin-syntax-dynamic-import']
            }
          }
        }
      ]
    },
    plugins: [
      new CopyPlugin({
        patterns: [
          { from: "src/manifest.json", to: "manifest.json" },
          { from: "src/html", to: "html" },
          { from: "src/css", to: "css" },
          { from: "src/assets", to: "assets" },
        ],
      }),
    ],
  };
};
