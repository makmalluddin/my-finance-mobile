const { defineConfig, globalIgnores } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  globalIgnores(['dist/*', '.expo/*']),
  expoConfig,
  {
    settings: {
      'import/resolver': {
        typescript: {
          project: './jsconfig.json',
          alwaysTryTypes: true,
        },
      },
    },
  },
  {
    files: ['**/__tests__/**/*.js', '**/*-test.js'],
    languageOptions: {
      globals: {
        beforeEach: 'readonly',
        describe: 'readonly',
        expect: 'readonly',
        jest: 'readonly',
        test: 'readonly',
      },
    },
  },
]);
