import { useEffect, useRef } from 'react'
import { useMarkBotRead, type Bot, type BotId, type LocalActivity } from '@/features/bots'
import { setReading, useChatStore, useReadingStore } from './stores'
import type { ChatItem, ChatState } from './types'
import { isStopping } from './utils/status-line'

const NO_ITEMS: ChatItem[] = []
const NO_QUEUE: ChatState['queue'] = []

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

export const useChatItems = (id: string) => {
  const kept = useRef(NO_ITEMS)
  return useChatStore((s) => {
    const next = s.chats[id]?.items ?? NO_ITEMS
    if (!sameSkeleton(kept.current, next)) kept.current = next
    return kept.current
  })
}

export const useLiveItem = (id: string, itemId: string) => useChatStore((s) => s.chats[id]?.items.findLast((i) => i.id === itemId))

export const useChatWorking = (id: string) => useChatStore((s) => s.chats[id]?.working ?? null)
export const useChatWaiting = (id: string) => useChatStore((s) => s.chats[id]?.waiting ?? null)
export const useChatAwaiting = (id: string) => useChatStore((s) => s.chats[id]?.awaiting ?? null)
export const useChatQueue = (id: string) => useChatStore((s) => s.chats[id]?.queue ?? NO_QUEUE)

export type RunPhase = 'idle' | 'working' | 'stopping'
export const useRunPhase = (id: string): RunPhase =>
  useChatStore((s) => {
    const working = s.chats[id]?.working ?? null
    return !working ? 'idle' : isStopping(working) ? 'stopping' : 'working'
  })

export const useLocalActivity = (): Readonly<Record<BotId, LocalActivity>> => useReadingStore((s) => s.byBot)

export const useReadWhileOpen = (bot: Bot | undefined, atBottom: boolean) => {
  const markRead = useMarkBotRead()
  const mark = useRef(markRead)
  const told = useRef<string | undefined>(undefined)
  useEffect(() => {
    mark.current = markRead
  })
  const id = bot?.id
  useEffect(() => {
    if (!id || !atBottom) return
    setReading(id, true)
    return () => setReading(id, false)
  }, [id, atBottom])
  const unread = bot?.unread
  const at = bot?.lastActivityAt.toISOString() ?? ''
  useEffect(() => {
    if (!bot || !unread || !atBottom || told.current === `${bot.id}@${at}`) return
    told.current = `${bot.id}@${at}`
    mark.current(bot)
  }, [bot, unread, at, atBottom])
}
