// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config')
const expoConfig = require('eslint-config-expo/flat')
const designTokens = require('./eslint/design-tokens')

module.exports = defineConfig([expoConfig, { ignores: ['dist/*', 'android/*', 'ios/*'] }, ...designTokens])
