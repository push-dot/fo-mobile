import type { Weight } from './tokens'

/** Native family names for the design-system sans face (Noto Sans KR). */
export const NATIVE_FONTS: Record<Weight, string> = {
  '400': 'NotoSansKR-Regular',
  '500': 'NotoSansKR-Medium',
  '600': 'NotoSansKR-SemiBold',
  '700': 'NotoSansKR-Bold',
  '800': 'NotoSansKR-ExtraBold',
}

/** Same face file on iOS and Android. A weight axis would make Android pick the wrong file. */
export const fontFor = (weight: Weight) => ({ fontFamily: NATIVE_FONTS[weight] })
