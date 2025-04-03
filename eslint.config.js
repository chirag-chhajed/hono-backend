import antfu from '@antfu/eslint-config';
import cspellPlugin from '@cspell/eslint-plugin';

export default antfu({
  typescript: {
    tsconfigPath: 'tsconfig.json',
  },
  ignores: ['dist/**', 'node_modules/**', 'dynamodb_data/**'],
  plugins: {
    '@cspell': cspellPlugin,
  },
  rules: {
    'perfectionist/sort-imports': [
      'error',
      {
        tsconfigRootDir: '.',
      },
    ],
    'ts/strict-boolean-expressions': 'off',
    '@cspell/spellchecker': ['warn', {
      cspell: {
        words: ['blurhash', 'electrodb', 'Organisation', 'Organisations'],
      },
    }],
    'ts/consistent-type-definitions': ['warn', 'type'],
  },
  formatters: {
    prettierOptions: {
      singleQuote: false,
      semi: true,
    },
  },
  stylistic: false,
});
