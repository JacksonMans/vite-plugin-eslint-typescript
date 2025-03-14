import js from '@eslint/js';
import unusedImports from 'eslint-plugin-unused-imports';
import tseslint from 'typescript-eslint';
import tseslintparser from '@typescript-eslint/parser';
import pluginPromise from 'eslint-plugin-promise';
import prettierPlugin from 'eslint-plugin-prettier/recommended';
import prettierConfig from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  pluginPromise.configs['flat/recommended'],
  prettierPlugin,
  prettierConfig,

  {
    ignores: ['dist', '.eslintcache'],
  },

  {
    languageOptions: {
      globals: { browser: true, worker: true, es2020: true },
      parser: tseslintparser,
      parserOptions: {
        ecmaVersion: 2020, // Allows for the parsing of modern ECMAScript features
        sourceType: 'module', // Allows for the use of imports
        ecmaFeatures: {
          jsx: true, // Allows for the parsing of JSX
        },
      },
    },
    plugins: {
      'unused-imports': unusedImports,
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      'import/no-default-export': 'off',
      'no-prototype-builtins': 'off',
      'promise/no-promise-in-callback': 'off',
      'prettier/prettier': 'error',
      'arrow-body-style': 'off',
      'prefer-arrow-callback': 'off',
    },
  },
];
