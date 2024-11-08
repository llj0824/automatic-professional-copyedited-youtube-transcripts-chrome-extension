// Use CommonJS for webpack config as it's more widely supported in Node.js tooling
const path = require('path');
const webpack = require('webpack');

module.exports = {
  // Entry point - where webpack starts bundling
  // In this case, our popup.js which imports encryption.js (which uses jsonwebtoken)
  entry: {
    popup: './popup/popup.js'
  },

  // Output configuration - where webpack should put the bundled file
  output: {
    filename: '[name].bundle.js', // [name] will be replaced with entry point key (i.e., 'popup')
    path: path.resolve(__dirname, 'dist/popup')
  },

  // Development mode provides better debugging, production will minimize code
  mode: 'production',

  // Critical for handling Node.js modules in browser environment
  resolve: {
    // Fallbacks for Node.js core modules that jsonwebtoken depends on
    fallback: {
      "process": require.resolve("process/browser"), // Required by jsonwebtoken
      // "crypto": false,  // Not needed for our JWT implementation
      "crypto": require.resolve("crypto-browserify"),
      "stream": require.resolve("stream-browserify"),  // Required by jsonwebtoken
      "buffer": require.resolve("buffer/"),  // Required for Buffer usage in jsonwebtoken
      "util": require.resolve("util/"),      // Required by jsonwebtoken internals
      "url": require.resolve("url/"),        // Required for URL handling
      "http": require.resolve("stream-http"), // Required for HTTP requests
      "https": require.resolve("https-browserify"), // Required for HTTPS requests
      "vm": require.resolve("vm-browserify")
    }
  },

  // Provide global variables that jsonwebtoken expects in a Node.js environment
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],  // Make Buffer available globally
      process: 'process/browser'     // Make process available globally
    }),
  ],

  // Transform modern JavaScript (including ES modules) to browser-compatible code
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },

  // Enable source maps for debugging
  devtool: 'source-map'
};