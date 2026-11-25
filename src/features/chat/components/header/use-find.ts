import { useCallback, useEffect, useRef, useState } from 'react'
import type { BotContract } from '@push/api-client'
import { showToast } from '@/shared/components/toast-store'
import { botApi } from '@/shared/infrastructure'
import { hasOlder, loadOlder, useChatStore } from '../../stores'
import { hitOf, matchLabel, revealMatch, stepMatch, type FindStep } from '../../utils/find'

const DEBOUNCE_MS = 300
const FAILED = '잠시 뒤에 다시 해 주세요.'

const FAIL = Symbol('reveal-failed')

const reveal = async (botId: string, match: BotContract.TranscriptMatch, list: BotContract.TranscriptMatch[], at: number) => {
  try {
    const id = await revealMatch(match, {
      items: () => useChatStore.getState().chats[botId]?.items ?? [],
      hasOlder: () => hasOlder(botId),
      loadOlder: () => loadOlder(botId),
    })
    return id === undefined ? undefined : { id, hit: hitOf(list, at) }
  } catch {
    return FAIL
  }
}

export const useFind = (botId: string) => {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [matches, setMatches] = useState<BotContract.TranscriptMatch[]>([])
  const [index, setIndex] = useState(0)
  const [current, setCurrent] = useState<{ id: string; hit: number }>()
  const latest = useRef(0)

  const land = useCallback(
    async (list: BotContract.TranscriptMatch[], at: number, ticket: number) => {
      const match = list[at]
      if (!match) return
      const found = await reveal(botId, match, list, at)
      if (ticket !== latest.current) return
      if (found === FAIL) showToast({ message: FAILED })
      else setCurrent(found)
    },
    [botId],
  )

  useEffect(() => {
    if (!open) return
    const q = query.trim()
    const ticket = ++latest.current
    if (!q) return
    const timer = setTimeout(() => {
      botApi.bots.findInChat(botId, q).then(
        (found) => {
          if (ticket !== latest.current) return
          setMatches(found.items)
          setIndex(0)
          setCurrent(undefined)
          void land(found.items, 0, ticket)
        },
        () => {
          if (ticket === latest.current) showToast({ message: FAILED })
        },
      )
    }, DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [open, query, botId, land])

  const shown = query.trim() ? matches : []

  const step = (to: FindStep) => {
    const next = stepMatch(index, shown.length, to)
    setIndex(next)
    void land(shown, next, ++latest.current)
  }

  const close = () => {
    latest.current++
    setOpen(false)
    setQuery('')
    setMatches([])
    setCurrent(undefined)
  }

  return {
    open,
    show: () => setOpen(true),
    close,
    query,
    setQuery,
    label: matchLabel(index, shown.length),
    step,
    currentId: current?.id,
    highlight: { query: open ? query : '', currentId: current?.id, currentHit: current?.hit },
  }
}
