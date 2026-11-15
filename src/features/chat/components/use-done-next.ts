import { useEffect, useRef } from 'react'
import { Alert } from 'react-native'
import { showChoiceModal } from '@/shared/navigation'
import { doneNextActions, doneNextCopy, SAVE_FAIL_MESSAGE, SAVE_FAIL_TITLE, saveFailed, type ResultAction } from '../utils/result-card'
import type { ChatItem, ChatState } from '../types'

type Result = Extract<ChatItem, { type: 'result' }>

/**
 * ChatDoneNext: when a run finishes with a result card, ask what to do next in a regular modal
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
    showChoiceModal({ ...doneNextCopy(card), items: actions.map((a) => ({ label: a.label, chevron: true, onPress: () => latest.current(a, card) })) })
  }, [chat.items, chat.working, chat.approval])
}

/** ChatPh6ResultFail: a file the bot could not save is told in the platform's alert, not a line in the chat; 다시 시도 asks the bot to save it again. */
export const useSaveFailAlert = (chat: Pick<ChatState, 'items'>, retry: () => void) => {
  const latest = useRef(retry)
  useEffect(() => {
    latest.current = retry
  })
  const told = useRef(new Set(chat.items.flatMap((i) => (i.type === 'result' ? [i.id] : []))))
  useEffect(() => {
    const card = chat.items.findLast((i): i is Result => i.type === 'result')
    if (!card || told.current.has(card.id)) return
    told.current.add(card.id)
    if (saveFailed(card)) Alert.alert(SAVE_FAIL_TITLE, SAVE_FAIL_MESSAGE, [{ text: '닫기', style: 'cancel' }, { text: '다시 시도', onPress: () => latest.current() }])
  }, [chat.items])
}
