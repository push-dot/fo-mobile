import { Platform, useColorScheme } from 'react-native'
import { themeMode } from './mode'
import { useThemePreference } from './preference'
import { palette, shadow, type Colors, type Weight } from './tokens'

export * from './tokens'
export * from './mode'
export { useThemePreference } from './preference'
export { spacing as space } from '@push/design-system'

export const useThemeMode = (): 'light' | 'dark' => {
  const system = useColorScheme()
  const choice = useThemePreference((s) => s.choice)
  return themeMode(choice, system === 'dark' ? 'dark' : system === 'light' ? 'light' : null)
}

export const useColors = (): Colors => (useThemeMode() === 'dark' ? palette.dark : palette.light)
export const useShadow = () => (useThemeMode() === 'dark' ? shadow.dark : shadow.light)

const PRETENDARD: Record<Weight, string> = {
  '400': 'Pretendard-Regular',
  '500': 'Pretendard-Medium',
  '600': 'Pretendard-SemiBold',
  '700': 'Pretendard-Bold',
  '800': 'Pretendard-ExtraBold',
}

export const fontFor = (weight: Weight) =>
  Platform.OS === 'ios' ? { fontFamily: PRETENDARD[weight] } : { fontWeight: weight }
