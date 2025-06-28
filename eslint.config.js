import antfu from '@antfu/eslint-config'
import cspell from '@cspell/eslint-plugin'

export default antfu({
  plugins: {
    '@cspell': cspell,
  },
  typescript: {
    tsconfigPath: 'tsconfig.json',
  },
  rules: {
    'perfectionist/sort-imports': [
      'error',
      {
        tsconfigRootDir: '.',
      },
    ],
    '@cspell/spellchecker': [
      'warn',
      {
        cspell: {
          words: [
            'blurhash',
            'dotenvx',
            'electrodb',
            'organisation',
            'Organisations',
          ],
        },
      },
    ],
    'ts/consistent-type-definitions': ['warn', 'type'],

    'format/prettier': [
      'warn',
      {
        singleQuote: true,
        semi: false,
      },
    ],
  },
  formatters: {
    prettierOptions: {
      singleQuote: false,
      semi: true,
    },
  },
  stylistic: false,
  markdown: true,
  yaml: true,
})
