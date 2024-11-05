// babel.config.cjs

// Handles the actual code transformation
// Converts syntax between module systems
// Works with Jest to transform your ES Module code

// note .cjs explicitly declares this file as CommonJS, vs babel.config.js follows the "type" field set in @package.json
// this file servese as a bridge between Jest's CommonJS syntax and the ES modules of codebase (specified @package.json's type:"module")
module.exports = {
  presets: [
    ['@babel/preset-env', {
      targets: { node: 'current' },
      modules: 'commonjs'  // false = Don't convert ES Modules to CommonJS
    }]
  ]
};
