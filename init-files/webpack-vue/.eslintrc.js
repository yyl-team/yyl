module.exports = {
  root: true,
  parser: 'babel-eslint',
  parserOptions: {
    sourceType: 'module'
  },
  env: {
    'browser': true
  },
  globals: {
    $: true,
    Vue: true
  },
  extends: 'airbnb-base',
  plugins: [
    'html'
  ],
  rules: {
    'no-debugger': 0,
    'no-console': 0,
    'func-names': 0,
    'import/no-unresolved': 0,
    'import/extensions': 0,
    'import/no-extraneous-dependencies': 0,
    'linebreak-style': 0
  }
};
