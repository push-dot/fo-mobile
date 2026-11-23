// The A2UI Compose renderer AARs need compileSdk 37.1. Expo parses `android.compileSdkVersion`
// as an Int, so expo-build-properties can set 37 but not the minor level: add it here.
const { withAppBuildGradle } = require('expo/config-plugins')

const LINE = '    compileSdkMinor 1 // push-a2ui'

module.exports = (config) =>
  withAppBuildGradle(config, (config) => {
    const gradle = config.modResults.contents
    if (!gradle.includes(LINE)) {
      const anchor = /^\s*compileSdk .*$/m
      if (!anchor.test(gradle)) throw new Error('push-a2ui: no compileSdk line in app/build.gradle')
      config.modResults.contents = gradle.replace(anchor, (line) => `${line}\n${LINE}`)
    }
    return config
  })
