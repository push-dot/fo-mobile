import { Platform, useColorScheme } from 'react-native'
import { themeMode } from './mode'
import { useThemePreference } from './preference'
import { platformTokens } from './platform'
import { palette, shadow, type Colors } from './tokens'

export * from './tokens'
export * from './mode'
export { fontFor, NATIVE_FONTS } from './fonts'
export { navigationColors } from './navigation-colors'
export { onAccent } from './on-accent'
export { selectedRing } from './selected-ring'
export { tabColor } from './tab-color'
export type { TabPlatform } from './tab-color'
export { useThemePreference } from './preference'
export { HIT_TARGET, STATUS_ROW_MIN_HEIGHT, hitSlopTo } from './hit-target'
export { platformTokens } from './platform'

export const platformTheme = platformTokens(Platform.OS === 'ios' ? 'ios' : 'android')

export const useThemeMode = (): 'light' | 'dark' => {
  const system = useColorScheme()
  const choice = useThemePreference((s) => s.choice)
  return themeMode(choice, system === 'dark' ? 'dark' : system === 'light' ? 'light' : null)
}

export const useColors = (): Colors => (useThemeMode() === 'dark' ? palette.dark : palette.light)
export const useShadow = () => (useThemeMode() === 'dark' ? shadow.dark : shadow.light)
