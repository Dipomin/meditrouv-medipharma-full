// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const tseslint = require('@typescript-eslint/eslint-plugin');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', '.expo/*'],
  },
  {
    // Verrous qualité issus de l'audit : pas de console dispersée
    // (utiliser `app/lib/logger`), pas de `any` explicite.
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      'no-console': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  {
    // Scripts Node utilitaires : console autorisée (sorties CLI).
    files: ['*.js', '*.cjs', '*.mjs'],
    rules: {
      'no-console': 'off',
    },
  },
]);
