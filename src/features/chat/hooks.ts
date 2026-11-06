import { router, useNavigation } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AccessibilityInfo, Animated, Easing, Keyboard, Platform, useWindowDimensions, type LayoutChangeEvent } from 'react-native'
import { initialWindowMetrics } from 'react-native-safe-area-context'
import { CLOSE_DRAWER } from './constants'
import { sheetScrollMax } from './utils/sheet-height'

/** Leaves a sidebar page for another screen: iOS shows the page over the open drawer, so close both first and back returns to the chat. */
export const useLeaveSidebar = () => {
  const navigation = useNavigation()
  return useCallback(
    (go: () => void) => {
      navigation.dispatch(CLOSE_DRAWER)
      router.back()
      go()
    },
    [navigation],
  )
}

export const useReduceMotion = () => {
  const [on, setOn] = useState(false)
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setOn)
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setOn)
    return () => sub.remove()
  }, [])
  return on
}

export const useKeyboardHeight = () => {
  const [height, setHeight] = useState(0)
  useEffect(() => {
    const ios = Platform.OS === 'ios'
    const show = Keyboard.addListener(ios ? 'keyboardWillShow' : 'keyboardDidShow', (e) => setHeight(e.endCoordinates.height))
    const hide = Keyboard.addListener(ios ? 'keyboardWillHide' : 'keyboardDidHide', () => setHeight(0))
    return () => (show.remove(), hide.remove())
  }, [])
  return height
}

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

export const usePulse = (active: boolean, period = 1000, low = 0.25) => {
  const reduce = useReduceMotion()
  const v = useState(() => new Animated.Value(1))[0]
  useEffect(() => {
    if (!active || reduce) {
      v.setValue(1)
      return
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: low, duration: period / 2, easing: Easing.step0, useNativeDriver: true }),
        Animated.timing(v, { toValue: 1, duration: period / 2, easing: Easing.step0, useNativeDriver: true }),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [active, reduce, v, period, low])
  return v
}

export const usePop = (on: boolean, duration = 200) => {
  const reduce = useReduceMotion()
  const v = useState(() => new Animated.Value(1))[0]
  const was = useRef(on)
  useEffect(() => {
    if (on && !was.current && !reduce) {
      v.setValue(0.3)
      Animated.sequence([
        Animated.timing(v, { toValue: 1.2, duration: duration * 0.6, useNativeDriver: true }),
        Animated.timing(v, { toValue: 1, duration: duration * 0.4, useNativeDriver: true }),
      ]).start()
    }
    was.current = on
  }, [on, reduce, v, duration])
  return v
}
