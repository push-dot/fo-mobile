import { useWindowDimensions } from 'react-native'

/** The system text size at which the boards draw their "큰 글씨" (.xl) variant. */
export const XL_TEXT_SCALE = 1.5

/** Under `.xl` the boards grow every round header button from 44 to 52 and the header row from 56 to 68. */
export const xlChrome = (xl: boolean) => ({ button: xl ? 52 : 44, row: xl ? 68 : 56 })

export const useXlChrome = () => {
  const xl = useWindowDimensions().fontScale >= XL_TEXT_SCALE
  return { xl, ...xlChrome(xl) }
}
