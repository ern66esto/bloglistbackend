import js from '@eslint/js';
import globals from 'globals';
import stylisticPlugin from '@stylistic/eslint-plugin-js';
import { defineConfig } from 'eslint/config';


export default defineConfig([
  { 
    files: ['**/*.{js,mjs,cjs}'], 
    plugins: { js, stylistic: stylisticPlugin }, 
    extends: ['js/recommended'],
    rules: {
      'stylistic/indent': ['error', 2],
      'stylistic/linebreak-style': ['error', 'unix'],
      'stylistic/quotes': ['error', 'single'],
      'stylistic/semi': ['error', 'always'],
    },
  },
  { files: ['**/*.js'], languageOptions: { sourceType: 'script' } },
  { files: ['**/*.{js,mjs,cjs}'], languageOptions: { globals: globals.node } },
]);