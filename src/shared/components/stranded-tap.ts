import { useRef, type ComponentRef, type RefObject } from 'react'
import type { GestureResponderEvent, Pressable } from 'react-native'

const SLOP = 10

type Point = { x: number; y: number }
type Box = { x: number; y: number; width: number; height: number }

/**
 * A touch that began and ended on the box without moving off it and never reached Pressable's press-in.
 * React Native hands a multiline TextInput the responder on a selection change while a touch is tracked
 * (`onSelectionChangeShouldSetResponder`), and a responder that is not released makes the next negotiation start at the
 * common ancestor, so the button under it is never asked and its tap is lost (offer reply sheet, accept and send).
 */
export const isStrandedTap = (pressedIn: boolean, start: Point, end: Point, box: Box) =>
  !pressedIn &&
  Math.hypot(end.x - start.x, end.y - start.y) <= SLOP &&
  end.x >= box.x &&
  end.x <= box.x + box.width &&
  end.y >= box.y &&
  end.y <= box.y + box.height

type Handlers = {
  ref: RefObject<ComponentRef<typeof Pressable> | null>
  onPressIn: (e: GestureResponderEvent) => void
  onTouchStart: (e: GestureResponderEvent) => void
  onTouchEnd: (e: GestureResponderEvent) => void
  onTouchCancel: (e: GestureResponderEvent) => void
}

/** Presses `onPress` for a tap that Pressable missed because another view still held the responder. */
export const useStrandedTap = (onPress: ((e: GestureResponderEvent) => void) | null | undefined, disabled: boolean | null | undefined, onPressIn: ((e: GestureResponderEvent) => void) | null | undefined): Handlers => {
  const ref = useRef<ComponentRef<typeof Pressable>>(null)
  const touch = useRef<{ pressedIn: boolean; start: Point | null }>({ pressedIn: false, start: null })
  const reset = () => (touch.current = { pressedIn: false, start: null })
  return {
    ref,
    onPressIn: (e) => {
      touch.current.pressedIn = true
      onPressIn?.(e)
    },
    onTouchStart: (e) => {
      touch.current.start = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY }
    },
    onTouchEnd: (e) => {
      const { pressedIn, start } = touch.current
      const end = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY }
      reset()
      if (disabled || !onPress || !start) return
      ref.current?.measureInWindow((x, y, width, height) => {
        if (isStrandedTap(pressedIn, start, end, { x, y, width, height })) onPress(e)
      })
    },
    onTouchCancel: reset,
  }
}
