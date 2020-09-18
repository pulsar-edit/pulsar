let presets = [
  [
    'babel-preset-atomic',
    {
      removeAllUseStrict: true // some of the packages use non-strict JavaScript in ES6 modules! We should fix those and then make it `false`
    }
  ]
];

let plugins = [];

module.exports = {
  presets: presets,
  plugins: plugins,
  exclude: 'node_modules/**',
  sourceMap: 'inline'
};
