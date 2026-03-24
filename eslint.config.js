import js from '@eslint/js';
import prettierPlugin from 'eslint-plugin-prettier/recommended';
import prettierConfig from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  prettierPlugin,
  prettierConfig,

  {
    ignores: ['dist', '.eslintcache'],
  },

  {
    languageOptions: {
      globals: { browser: true, worker: true, es2020: true },
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      'no-unused-vars': 'off',
      'no-prototype-builtins': 'off',
      'prettier/prettier': 'error',
      'arrow-body-style': 'off',
      'prefer-arrow-callback': 'off',
    },
  },
];
