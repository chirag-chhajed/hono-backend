import antfu from '@antfu/eslint-config';

export default antfu({
  typescript: {
    tsconfigPath: 'tsconfig.json',
  },
  ignores: ['dist/**', 'node_modules/**', 'dynamodb_data/**'],
  rules: {
    'perfectionist/sort-imports': [
      'error',
      {
        tsconfigRootDir: '.',
      },
    ],
    'ts/strict-boolean-expressions': 'off',
  },
  formatters: {
    prettierOptions: {
      singleQuote: false,
      semi: true,
    },
  },
  stylistic: {
    semi: true,
  },
});
