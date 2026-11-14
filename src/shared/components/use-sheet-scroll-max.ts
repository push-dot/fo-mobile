import { useState } from 'react'
import { Platform, useWindowDimensions, type LayoutChangeEvent } from 'react-native'
import { initialWindowMetrics } from 'react-native-safe-area-context'
import { sheetScrollMax } from '../utility'
import { floatingSheet } from './sheet-scale'
import { useKeyboardHeight } from './use-keyboard-height'

/** Bounds a SheetScroll by the room left on screen: pass `onSheetLayout` to the Sheet and `onScrollLayout` to the SheetScroll. */
export const useSheetScrollMax = (cap: number) => {
  const { height, width } = useWindowDimensions()
  const keyboard = useKeyboardHeight()
  const [sheet, setSheet] = useState(0)
  const [scroll, setScroll] = useState(0)
  const scale = Platform.OS === 'ios' ? (floatingSheet(width, Platform.Version, initialWindowMetrics?.insets.bottom ?? 0, keyboard > 0)?.scale ?? 1) : 1
  return {
    maxHeight: sheetScrollMax(height, initialWindowMetrics?.insets.top ?? 0, keyboard, sheet - scroll, cap, scale),
    onSheetLayout: (e: LayoutChangeEvent) => setSheet(e.nativeEvent.layout.height),
    onScrollLayout: (e: LayoutChangeEvent) => setScroll(e.nativeEvent.layout.height),
  }
}
