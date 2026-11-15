import { useEffect, useRef } from 'react'
import { Alert } from 'react-native'
import { showActionSheet } from '@/shared/components/action-sheet'
import { doneNextActions, doneNextCopy, saveFailed, type ResultAction } from '../utils/result-card'
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
    if (saveFailed(card)) return
    const actions = doneNextActions(card)
    if (!actions.length) return
    showActionSheet({ ...doneNextCopy(card), items: actions.map((a) => ({ label: a.label, onPress: () => latest.current(a, card) })) })
  }, [chat.items, chat.working, chat.approval])
}

/** ChatPh6ResultFail: a file the bot could not save is told in the platform's alert, not a line in the chat. */
export const useSaveFailAlert = (chat: Pick<ChatState, 'items'>) => {
  const told = useRef(new Set(chat.items.flatMap((i) => (i.type === 'result' ? [i.id] : []))))
  useEffect(() => {
    const card = chat.items.findLast((i): i is Result => i.type === 'result')
    if (!card || told.current.has(card.id)) return
    told.current.add(card.id)
    if (saveFailed(card)) Alert.alert('내 서류에 저장하지 못했어요')
  }, [chat.items])
}
