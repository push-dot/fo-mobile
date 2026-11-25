import { StyleSheet, UnistylesRuntime } from 'react-native-unistyles'
import { useThemePreference } from './preference'
import { platformTheme } from './platform-theme'
import { palette, radius, shadow, spacing, type } from './tokens'

const themeOf = (mode: 'light' | 'dark') => ({
  mode,
  colors: palette[mode],
  shadow: shadow[mode],
  spacing,
  radius,
  type,
  platform: platformTheme,
})

const themes = { light: themeOf('light'), dark: themeOf('dark') }

type AppThemes = typeof themes

declare module 'react-native-unistyles' {
  export interface UnistylesThemes extends AppThemes {}
}

StyleSheet.configure({ themes, settings: { adaptiveThemes: true } })

const applyChoice = (choice: ReturnType<typeof useThemePreference.getState>['choice']) => {
  if (choice === 'system') return UnistylesRuntime.setAdaptiveThemes(true)
  UnistylesRuntime.setAdaptiveThemes(false)
  UnistylesRuntime.setTheme(choice)
}

useThemePreference.subscribe((state) => applyChoice(state.choice))
