import { Platform, useColorScheme } from 'react-native'
import { palette, shadow, type Colors } from './tokens'

export * from './tokens'

export const useColors = (): Colors => (useColorScheme() === 'dark' ? palette.dark : palette.light)
export const useShadow = () => (useColorScheme() === 'dark' ? shadow.dark : shadow.light)

type Weight = '400' | '500' | '600' | '700' | '800'

// iOS embeds Pretendard (expo-font plugin); Android uses the system Korean font (Noto Sans KR), per design.
const PRETENDARD: Record<Weight, string> = {
  '400': 'Pretendard-Regular',
  '500': 'Pretendard-Medium',
  '600': 'Pretendard-SemiBold',
  '700': 'Pretendard-Bold',
  '800': 'Pretendard-ExtraBold',
}

export const fontFor = (weight: Weight) =>
  Platform.OS === 'ios' ? { fontFamily: PRETENDARD[weight] } : { fontWeight: weight }

export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24 } as const
