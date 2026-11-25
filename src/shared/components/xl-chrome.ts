import { createContext, createElement, useContext, type ReactNode } from 'react'
import { useWindowDimensions } from 'react-native'
import { isXlBoardText } from './xl-scale'

export { isXlBoardText, XL_BOARD_TEXT_SCALE } from './xl-scale'

export const XL_TEXT_SCALE = 1.5
export const isXlScale = (fontScale: number) => fontScale >= XL_TEXT_SCALE

export const useXlBoardText = () => isXlBoardText(useWindowDimensions().fontScale)
export const XL_CHAT_TRACKING = -0.315

export const xlChrome = (xl: boolean) => ({ button: xl ? 52 : 44, row: xl ? 68 : 56 })

const XlGate = createContext<'chrome' | 'board'>('chrome')

export const XlBoardChrome = ({ children }: { children: ReactNode }) => createElement(XlGate.Provider, { value: 'board' }, children)

export const useXlChrome = () => {
  const gate = useContext(XlGate)
  const fontScale = useWindowDimensions().fontScale
  const xl = gate === 'board' ? isXlBoardText(fontScale) : isXlScale(fontScale)
  return { xl, ...xlChrome(xl) }
}
