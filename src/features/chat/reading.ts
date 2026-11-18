import { useEffect, useRef } from 'react'
import { create } from 'zustand'
import { useMarkBotRead, type Bot, type BotId, type LocalActivity } from '@/features/bots'

const NONE: Readonly<Record<BotId, LocalActivity>> = {}

// Chats that are open at the bottom right now. The Bot home reads this beside the server list.
export const useReadingStore = create<{ byBot: Readonly<Record<BotId, LocalActivity>> }>(() => ({ byBot: NONE }))

export const setReading = (id: BotId, reading: boolean) => {
  useReadingStore.setState(({ byBot }) => {
    if (!!byBot[id] === reading) return { byBot }
    if (reading) return { byBot: { ...byBot, [id]: { reading: true } } }
    const { [id]: _, ...rest } = byBot
    return { byBot: rest }
  })
}

/** What this session knows about each bot beyond the bot list. */
export const useLocalActivity = (): Readonly<Record<BotId, LocalActivity>> => useReadingStore((s) => s.byBot)

/**
 * An open chat, at the bottom, is read: the home row clears at once (local), and the server is told once per
 * newest line (`lastActivityAt`), so a refused call does not loop and a line that arrives later is marked in turn.
 */
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
    void mark.current(bot).catch(() => undefined)
  }, [bot, unread, at, atBottom])
}
