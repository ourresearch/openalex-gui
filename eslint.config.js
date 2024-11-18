import tsParser from '@typescript-eslint/parser';
import js from '@eslint/js';
import sonarJs from 'eslint-plugin-sonarjs';
import pluginVue from 'eslint-plugin-vue';
import vueParser from 'vue-eslint-parser';
import eslintConfigPrettier from 'eslint-config-prettier';
import pluginVuetify from 'eslint-plugin-vuetify';

export default [
  js.configs.recommended,
  sonarJs.configs.recommended,
  ...pluginVue.configs['flat/essential'],
  ...pluginVue.configs['flat/strongly-recommended'],
  ...pluginVue.configs['flat/recommended'],
  eslintConfigPrettier,
  {
    languageOptions: {
      parser: vueParser,
      globals: {
        node: true,
      },
      parserOptions: {
        ecmaVersion: 2020,
        parser: tsParser,
      },
    },
    rules: {
      'vue/component-name-in-template-casing': ['error', 'kebab-case'],
      'vue/component-tags-order': [
        'error',
        {
          order: ['script', 'template', 'style'],
        },
      ],
      // Add Vuetify-specific rules
      ...pluginVuetify.configs.recommended,
    },
  },
];
