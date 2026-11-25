const { defineConfig } = require('eslint/config')
const expoConfig = require('eslint-config-expo/flat')
const { native } = require('@push/eslint-config')
const designTokens = require('./eslint/design-tokens')

const NODE_FILES = ['src/mock/**', 'src/**/__tests__/**', 'src/**/*.test.ts']

module.exports = defineConfig([
  expoConfig,
  { ignores: ['dist/*', 'android/*', 'ios/*'] },
  ...designTokens,
  ...native({
    uiFiles: ['src/screens/**', 'src/features/*/components/**', 'src/shared/components/**'],
    infraModules: ['@push/api-client'],
    openFiles: NODE_FILES,
    open: ['constants', 'types', 'utils/'],
  }),
  { files: ['src/app/**'], rules: { 'coding-hooks/filename-case': 'off' } },
])
