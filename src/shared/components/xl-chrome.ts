import { createContext, createElement, useContext, type ReactNode } from 'react'
import { useWindowDimensions } from 'react-native'
import { isXlBoardText } from './xl-scale'

export { isXlBoardText, XL_BOARD_TEXT_SCALE } from './xl-scale'

/** The system text size at which the boards draw their "큰 글씨" (.xl) chrome: 52 pt header buttons, 68 pt rows, the XL Home/Profile/Materials boxes. */
export const XL_TEXT_SCALE = 1.5
export const isXlScale = (fontScale: number) => fontScale >= XL_TEXT_SCALE

export const useXlBoardText = () => isXlBoardText(useWindowDimensions().fontScale)
/** `.xl .msg` and `.me` lay the 21 pt chat text out at -0.015em (-0.02em at 16): the harness render is 1.6 pt wider per line than CoreText at -0.02em, which moves a wrap. */
export const XL_CHAT_TRACKING = -0.315

/** Under `.xl` the boards grow every round header button from 44 to 52 and the header row from 56 to 68. */
export const xlChrome = (xl: boolean) => ({ button: xl ? 52 : 44, row: xl ? 68 : 56 })

const XlGate = createContext<'chrome' | 'board'>('chrome')

/** The agent boards (chat room, Bot-create, Bot Home, Bot Profile, Materials) draw their XL chrome (header 68, buttons 52) at the harness XL size; every other screen keeps 1.5. */
export const XlBoardChrome = ({ children }: { children: ReactNode }) => createElement(XlGate.Provider, { value: 'board' }, children)

export const useXlChrome = () => {
  const gate = useContext(XlGate)
  const fontScale = useWindowDimensions().fontScale
  const xl = gate === 'board' ? isXlBoardText(fontScale) : isXlScale(fontScale)
  return { xl, ...xlChrome(xl) }
}
