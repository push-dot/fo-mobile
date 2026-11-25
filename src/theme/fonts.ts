import type { Weight } from './tokens'

export const NATIVE_FONTS: Record<Weight, string> = {
  '400': 'NotoSansKR-Regular',
  '500': 'NotoSansKR-Medium',
  '600': 'NotoSansKR-SemiBold',
  '700': 'NotoSansKR-Bold',
  '800': 'NotoSansKR-ExtraBold',
}

export const fontFor = (weight: Weight) => ({ fontFamily: NATIVE_FONTS[weight] })
