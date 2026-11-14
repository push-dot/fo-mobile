import { useWindowDimensions } from 'react-native'

/**
 * The system text size from which the boards draw their "큰 글씨" (.xl) variant. The harness XL run is iOS content size
 * extra-extra-large (RN fontScale 1.235) and Android font_scale 1.3; the next size down is 1.12 (iOS) / 1.15 (Android),
 * so 1.2 splits the two. Every .xl gate in the app reads this one value (see isXlScale).
 */
export const XL_TEXT_SCALE = 1.2
export const isXlScale = (fontScale: number) => fontScale >= XL_TEXT_SCALE

/** Under `.xl` the boards grow every round header button from 44 to 52 and the header row from 56 to 68. */
export const xlChrome = (xl: boolean) => ({ button: xl ? 52 : 44, row: xl ? 68 : 56 })

export const useXlChrome = () => {
  const xl = isXlScale(useWindowDimensions().fontScale)
  return { xl, ...xlChrome(xl) }
}
