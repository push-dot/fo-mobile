import { useColorScheme } from 'react-native'
import { themeMode } from './mode'
import { useThemePreference } from './preference'
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
export { spacing as space } from '@push/design-system'

export const useThemeMode = (): 'light' | 'dark' => {
  const system = useColorScheme()
  const choice = useThemePreference((s) => s.choice)
  return themeMode(choice, system === 'dark' ? 'dark' : system === 'light' ? 'light' : null)
}

export const useColors = (): Colors => (useThemeMode() === 'dark' ? palette.dark : palette.light)
export const useShadow = () => (useThemeMode() === 'dark' ? shadow.dark : shadow.light)
