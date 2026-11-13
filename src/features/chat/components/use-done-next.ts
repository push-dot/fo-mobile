import { useEffect, useRef } from 'react'
import { showActionSheet } from '@/shared/components/action-sheet'
import { doneNextActions, doneNextCopy, type ResultAction } from '../utils/result-card'
import type { ChatItem, ChatState } from '../types'

type Result = Extract<ChatItem, { type: 'result' }>

/**
 * ChatDoneNext: when a run finishes with a result card, ask what to do next in the platform's action sheet
 * instead of drawing buttons in the chat. A card already in the thread when it opens is never asked about.
 */
export const useDoneNext = (chat: Pick<ChatState, 'items' | 'working' | 'approval'>, run: (action: ResultAction, card: Result) => void) => {
  const asked = useRef(new Set(chat.items.flatMap((i) => (i.type === 'result' ? [i.id] : []))))
  const armed = useRef(false)
  const latest = useRef(run)
  useEffect(() => {
    latest.current = run
  })
  useEffect(() => {
    if (chat.working) armed.current = true
    if (chat.working || chat.approval || !armed.current) return
    const card = chat.items.findLast((i): i is Result => i.type === 'result')
    if (!card || asked.current.has(card.id)) return
    asked.current.add(card.id)
    armed.current = false
    const actions = doneNextActions(card)
    if (!actions.length) return
    showActionSheet({ ...doneNextCopy(card), items: actions.map((a) => ({ label: a.label, onPress: () => latest.current(a, card) })) })
  }, [chat.items, chat.working, chat.approval])
}
