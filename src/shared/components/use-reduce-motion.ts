import { useSyncExternalStore } from 'react'
import { AccessibilityInfo } from 'react-native'

type Event = 'reduceMotionChanged' | 'reduceTransparencyChanged'

const flag = (query: (() => Promise<boolean>) | undefined, event: Event) => {
  let on = false
  const listeners = new Set<() => void>()
  const set = (next: boolean) => {
    if (next === on) return
    on = next
    listeners.forEach((l) => l())
  }
  void query?.().then(set, () => undefined)
  AccessibilityInfo?.addEventListener?.(event, set)
  const subscribe = (l: () => void) => {
    listeners.add(l)
    return () => void listeners.delete(l)
  }
  const get = () => on
  return () => useSyncExternalStore(subscribe, get, get)
}

export const useReduceMotion = flag(AccessibilityInfo?.isReduceMotionEnabled, 'reduceMotionChanged')
export const useReduceTransparency = flag(AccessibilityInfo?.isReduceTransparencyEnabled, 'reduceTransparencyChanged')
