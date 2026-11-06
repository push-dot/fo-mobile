import { useState } from 'react'
import { useWindowDimensions, type LayoutChangeEvent } from 'react-native'
import { initialWindowMetrics } from 'react-native-safe-area-context'
import { sheetScrollMax } from '../utility'
import { useKeyboardHeight } from './use-keyboard-height'

/** Bounds a SheetScroll by the room left on screen: pass `onSheetLayout` to the Sheet and `onScrollLayout` to the SheetScroll. */
export const useSheetScrollMax = (cap: number) => {
  const { height } = useWindowDimensions()
  const keyboard = useKeyboardHeight()
  const [sheet, setSheet] = useState(0)
  const [scroll, setScroll] = useState(0)
  return {
    maxHeight: sheetScrollMax(height, initialWindowMetrics?.insets.top ?? 0, keyboard, sheet - scroll, cap),
    onSheetLayout: (e: LayoutChangeEvent) => setSheet(e.nativeEvent.layout.height),
    onScrollLayout: (e: LayoutChangeEvent) => setScroll(e.nativeEvent.layout.height),
  }
}
