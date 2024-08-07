module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'next/core-web-vitals',
    'plugin:github/recommended',
    'plugin:jest/recommended',
    'plugin:sonarjs/recommended-legacy',
  ],
  overrides: [],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['github', 'jest', 'sonarjs'],
  rules: {
    'i18n-text/no-en': 'off',
    'import/no-namespace': 'off',
    'filenames/match-regex': 'off',
    'react/react-in-jsx-scope': 'off',
  },
};
