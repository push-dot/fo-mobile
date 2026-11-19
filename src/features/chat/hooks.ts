import { useEffect, useRef, useState } from 'react'
import { Animated } from 'react-native'
import { useReduceMotion } from '@/shared/components'
import { useChatStore } from './stores'
import type { ChatItem, ChatState } from './types'
import { isStopping } from './utils/status-line'

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

const NO_ITEMS: ChatItem[] = []
const NO_QUEUE: ChatState['queue'] = []

/** Same thread, except that the last bot line grew: a token batch changes only its text. */
const sameSkeleton = (a: readonly ChatItem[], b: readonly ChatItem[]) => {
  if (a === b) return true
  if (a.length !== b.length) return false
  const last = a.length - 1
  for (let i = 0; i < last; i++) if (a[i] !== b[i]) return false
  const x = a[last]
  const y = b[last]
  if (!x || !y || x === y) return true
  if (x.type !== 'agentText' || y.type !== 'agentText' || x.id !== y.id) return false
  const keys = new Set([...Object.keys(x), ...Object.keys(y)])
  keys.delete('text')
  return [...keys].every((k) => (x as Record<string, unknown>)[k] === (y as Record<string, unknown>)[k])
}

/**
 * The thread's items without the streaming text: the array only changes when a line is added, replaced or changes more than its text,
 * so the screen does not re-render per token. The growing line reads its own text with `useLiveItem`.
 */
export const useChatItems = (id: string) => {
  const kept = useRef(NO_ITEMS)
  return useChatStore((s) => {
    const next = s.chats[id]?.items ?? NO_ITEMS
    if (!sameSkeleton(kept.current, next)) kept.current = next
    return kept.current
  })
}

/** One line of the thread, always as new as the store: for the line that is still streaming. */
export const useLiveItem = (id: string, itemId: string) => useChatStore((s) => s.chats[id]?.items.findLast((i) => i.id === itemId))

export const useChatWorking = (id: string) => useChatStore((s) => s.chats[id]?.working ?? null)
export const useChatApproval = (id: string) => useChatStore((s) => s.chats[id]?.approval ?? null)
export const useChatAwaiting = (id: string) => useChatStore((s) => s.chats[id]?.awaiting ?? null)
export const useChatQueue = (id: string) => useChatStore((s) => s.chats[id]?.queue ?? NO_QUEUE)

export type RunPhase = 'idle' | 'working' | 'stopping'
/** A status event (new verbs) does not change the phase, so only start, stop and done re-render a reader. */
export const useRunPhase = (id: string): RunPhase =>
  useChatStore((s) => {
    const working = s.chats[id]?.working ?? null
    return !working ? 'idle' : isStopping(working) ? 'stopping' : 'working'
  })
