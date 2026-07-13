// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const eslintConfigPrettier = require('eslint-config-prettier');

module.exports = defineConfig([
  expoConfig,
  // Desliga regras de estilo que conflitam com o Prettier (formatação é do Prettier).
  eslintConfigPrettier,
  {
    // Testes precisam declarar jest.mock() antes dos imports que dependem dele.
    files: ['**/*.test.{ts,tsx}'],
    rules: {
      'import/first': 'off',
    },
  },
  {
    ignores: ['dist/*', 'coverage/*'],
  },
]);
