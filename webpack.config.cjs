const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    mode: isProduction ? 'production' : 'development',
    // Use 'cheap-module-source-map' for development for faster builds,
    // or 'source-map' for production for better quality source maps.
    devtool: isProduction ? 'source-map' : 'cheap-module-source-map',
    entry: {
      // Define entry points for your scripts
      popup: './popup/popup.js',
      background: './background/service_worker.js',
      // Add other scripts that need bundling as separate entries if necessary
      // e.g., contentScript: './content_scripts/content.js'
    },
    output: {
      // Output bundled files to the 'dist' directory
      path: path.resolve(__dirname, 'dist'),
      // Use the entry name for the output filename (e.g., popup.bundle.js)
      filename: '[name].bundle.js',
      // Clean the output directory before each build
      clean: true,
    },
    module: {
      rules: [
        {
          // Use babel-loader for JavaScript files if you need transpilation
          // If your code works directly in modern Chrome, you might skip this
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              // Ensure you have a babel.config.js or .babelrc if needed
              // Example basic preset:
              presets: [['@babel/preset-env', { targets: "defaults" }]]
            }
          }
        },
      ],
    },
    plugins: [
      // Copy static assets to the 'dist' directory
      new CopyPlugin({
        patterns: [
          { from: 'manifest.json', to: 'manifest.json' }, // Copy manifest
          { from: 'popup/popup.html', to: 'popup.html' },
          { from: 'icons', to: 'icons' },
          // Add any other static assets like CSS files if they aren't imported in JS
          // { from: 'popup/style.css', to: 'popup.css' },
        ],
      }),
    ],
    resolve: {
      // Helps resolve module imports
      extensions: ['.js'],
      // Add fallbacks for Node.js core modules
      fallback: {
        "crypto": require.resolve("crypto-browserify"),
        "stream": require.resolve("stream-browserify"),
        "https": require.resolve("https-browserify"),
        "zlib": require.resolve("browserify-zlib"),
        "path": require.resolve("path-browserify"),
        "util": require.resolve("util/"),
        "vm": require.resolve("vm-browserify"),
        "assert": require.resolve("assert/"),
        "http": require.resolve("stream-http"),
        "url": require.resolve("url/"),
        // Modules that likely aren't needed in the browser context and have no simple polyfill
        "fs": false,
        "child_process": false, 
        "net": false, // Might be needed by http(s) agents, map to false if not
        "tls": false, // Might be needed by http(s) agents, map to false if not
        "os": false // Add if you encounter errors related to 'os'
      }
    },
    // Optional: Performance hints configuration
    performance: {
      hints: isProduction ? 'warning' : false, // Show hints only in production
    },
  };
};

