import { useEffect, useRef } from 'react'
import { create } from 'zustand'
import { useMarkBotRead, type Bot, type BotId, type LocalActivity } from '@/features/bots'

const NONE: Readonly<Record<BotId, LocalActivity>> = {}

export const useReadingStore = create<{ byBot: Readonly<Record<BotId, LocalActivity>> }>(() => ({ byBot: NONE }))

export const setReading = (id: BotId, reading: boolean) => {
  useReadingStore.setState(({ byBot }) => {
    if (!!byBot[id] === reading) return { byBot }
    if (reading) return { byBot: { ...byBot, [id]: { reading: true } } }
    const { [id]: _, ...rest } = byBot
    return { byBot: rest }
  })
}

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
    void mark.current(bot).catch(() => undefined)
  }, [bot, unread, at, atBottom])
}
