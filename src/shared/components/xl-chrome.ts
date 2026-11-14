import { createContext, createElement, useContext, type ReactNode } from 'react'
import { useWindowDimensions } from 'react-native'

/** The system text size at which the boards draw their "큰 글씨" (.xl) chrome: 52 pt header buttons, 68 pt rows, the XL Home/Profile/Materials boxes. */
export const XL_TEXT_SCALE = 1.5
export const isXlScale = (fontScale: number) => fontScale >= XL_TEXT_SCALE

/**
 * The text of the XL boards the harness draws (BotNewXL, ChatBotHeaderXL) is laid out for the harness XL size: iOS content size extra-extra-large
 * (RN fontScale 1.235) and Android font_scale 1.3; the next size down is 1.12 / 1.15, so 1.2 splits them. Only the chat text and the Bot-create sheet
 * read this gate: the other XL boxes (header 68, Home, Profile, Materials) were drawn for 1.5 and keep XL_TEXT_SCALE.
 */
export const XL_BOARD_TEXT_SCALE = 1.2
export const isXlBoardText = (fontScale: number) => fontScale >= XL_BOARD_TEXT_SCALE
export const useXlBoardText = () => isXlBoardText(useWindowDimensions().fontScale)

/** Under `.xl` the boards grow every round header button from 44 to 52 and the header row from 56 to 68. */
export const xlChrome = (xl: boolean) => ({ button: xl ? 52 : 44, row: xl ? 68 : 56 })

const XlGate = createContext<'chrome' | 'board'>('chrome')

/** The chat room and the Bot-create sheet draw their XL chrome (header 68, buttons 52) at the harness XL size; every other screen keeps 1.5. */
export const XlBoardChrome = ({ children }: { children: ReactNode }) => createElement(XlGate.Provider, { value: 'board' }, children)

export const useXlChrome = () => {
  const gate = useContext(XlGate)
  const fontScale = useWindowDimensions().fontScale
  const xl = gate === 'board' ? isXlBoardText(fontScale) : isXlScale(fontScale)
  return { xl, ...xlChrome(xl) }
}
