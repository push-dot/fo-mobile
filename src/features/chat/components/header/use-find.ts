import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { BotContract } from '@push/api-client'
import { showToast } from '@/shared/components/toast-store'
import { botApi } from '@/shared/infrastructure'
import { hasOlder, loadOlder, useChatStore } from '../../stores'
import { matchLabel, revealMatch, stepMatch, type FindStep } from '../../utils/find'

const DEBOUNCE_MS = 300
const FAILED = '잠시 뒤에 다시 해 주세요.'

/** 채팅에서 찾기: the server searches the whole history, the app pages in older turns until the result's line exists. */
export const useFind = (botId: string) => {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [matches, setMatches] = useState<BotContract.TranscriptMatch[]>([])
  const [index, setIndex] = useState(0)
  const [currentId, setCurrentId] = useState<string>()
  const latest = useRef(0)

  const land = useCallback(
    async (list: BotContract.TranscriptMatch[], at: number, ticket: number) => {
      const match = list[at]
      if (!match) return
      try {
        const id = await revealMatch(match, {
          items: () => useChatStore.getState().chats[botId]?.items ?? [],
          hasOlder: () => hasOlder(botId),
          loadOlder: () => loadOlder(botId),
        })
        if (ticket === latest.current) setCurrentId(id)
      } catch {
        if (ticket === latest.current) showToast({ message: FAILED })
      }
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
          setCurrentId(undefined)
          void land(found.items, 0, ticket)
        },
        () => {
          if (ticket === latest.current) showToast({ message: FAILED })
        },
      )
    }, DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [open, query, botId, land])

  // A blank query shows no results, whatever the last search left behind.
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
    setCurrentId(undefined)
  }

  return {
    open,
    show: () => setOpen(true),
    close,
    query,
    setQuery,
    label: matchLabel(index, shown.length),
    step,
    currentId,
    highlight: useMemo(() => ({ query: open ? query : '', currentId }), [open, query, currentId]),
  }
}
