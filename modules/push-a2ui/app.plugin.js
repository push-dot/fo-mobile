// The A2UI Compose renderer AARs need compileSdk 37.1. Expo parses `android.compileSdkVersion`
// as an Int, so expo-build-properties can set 37 but not the minor level: add it here.
const { withAppBuildGradle, withProjectBuildGradle } = require('expo/config-plugins')

const LINE = '    compileSdkMinor 1 // push-a2ui'

// Every library that depends on push-a2ui (the `expo` umbrella module included) fails
// checkReleaseAarMetadata unless it compiles against 37.1 as well.
const LIBRARIES = `
// push-a2ui: compile every library against 37.1
subprojects { p ->
  p.plugins.withId('com.android.library') {
    p.androidComponents.finalizeDsl { it.compileSdkMinor = 1 }
  }
}
`

const withApp = (config) =>
  withAppBuildGradle(config, (config) => {
    const gradle = config.modResults.contents
    if (!gradle.includes(LINE)) {
      const anchor = /^\s*compileSdk .*$/m
      if (!anchor.test(gradle)) throw new Error('push-a2ui: no compileSdk line in app/build.gradle')
      config.modResults.contents = gradle.replace(anchor, (line) => `${line}\n${LINE}`)
    }
    return config
  })

const withLibraries = (config) =>
  withProjectBuildGradle(config, (config) => {
    if (!config.modResults.contents.includes(LIBRARIES)) config.modResults.contents += LIBRARIES
    return config
  })

module.exports = (config) => withLibraries(withApp(config))
