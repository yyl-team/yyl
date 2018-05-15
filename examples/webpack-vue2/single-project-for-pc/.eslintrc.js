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
    Vue: true,
    Vuex: true,
    VueRouter: true
  },
  extends: 'airbnb-base',
  plugins: [
    'html'
  ],
  rules: {
    'no-debugger': 2,
    'no-console': 1,
    'func-names': 0,
    'import/no-unresolved': 0,
    'import/extensions': 0,
    'import/no-extraneous-dependencies': 0,
    'linebreak-style': 0,
    'no-param-reassign': [2, { 'props': false }],
    'comma-dangle': [2, 'never'],
    'quote-props': ["error", "consistent"]
  }
};
