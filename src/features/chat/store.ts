import * as Haptics from 'expo-haptics'
import { create } from 'zustand'
import { ApiError } from '@push/api-client'
import { api } from '../../lib/api'
import { API_MOCK } from '../../lib/config'
import { chatApi, type RunInput } from './api'
import { applyEvent, emptyChat } from './reducer'
import { errorText, fromStream } from './stream'
import type { ChatEvent, ChatState } from './types'

// Runs live outside React so they keep going when the conversation screen closes (feature-spec 2).
export const useChatStore = create<{ chats: Record<string, ChatState> }>(() => ({ chats: {} }))
export const useChat = (id: string) => useChatStore((s) => s.chats[id] ?? emptyChat)

/** 계정 › 대화 settings that have no server field yet (shortcut: session-only until push-be adds them). */
export const usePrefs = create<{ effort: 'LOW' | 'MEDIUM' | 'HIGH' | 'MAX'; confirm: boolean }>(() => ({ effort: 'MEDIUM', confirm: true }))

const get = (id: string) => useChatStore.getState().chats[id] ?? emptyChat
const runs = new Map<string, AbortController>()

const dispatch = (id: string, e: ChatEvent) => {
  useChatStore.setState((s) => ({ chats: { ...s.chats, [id]: applyEvent(s.chats[id] ?? emptyChat, e) } }))
  if (e.type === 'approval') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  if (e.type === 'done') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  if (e.type === 'error') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
}

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms)
    signal.addEventListener('abort', () => (clearTimeout(t), reject(new Error('aborted'))), { once: true })
  })

/** Mock: replays the scripted run from src/mock/chat.ts with its timings. */
async function* scripted(input: RunInput, signal: AbortSignal): AsyncGenerator<ChatEvent> {
  for (const step of await chatApi.run(input)) {
    await sleep(step.wait, signal)
    yield step.event
  }
}

/** Real backend: the SSE stream only has token/status/done/error today (approvals stay mock-only). */
function streamed(input: RunInput, signal: AbortSignal): AsyncGenerator<ChatEvent> {
  const id = input.conversationId
  const body = { text: input.text ?? '', accessMode: usePrefs.getState().confirm ? ('CONFIRM_ACTIONS' as const) : ('SUGGEST' as const) }
  return fromStream(api.conversations.stream(id, body, signal), (after) => api.conversations.active(id, after, signal))
}

async function startRun(input: RunInput) {
  const id = input.conversationId
  const ctrl = new AbortController()
  runs.set(id, ctrl)
  dispatch(id, { type: 'start', at: Date.now() })
  try {
    for await (const e of (API_MOCK ? scripted : streamed)(input, ctrl.signal)) {
      dispatch(id, e.type === 'done' ? { type: 'done', at: Date.now() } : e)
    }
    if (get(id).working) dispatch(id, { type: 'done', at: Date.now() })
  } catch (err) {
    if (ctrl.signal.aborted) return
    dispatch(id, { type: 'error', id: `err-${Date.now()}`, text: errorText(err instanceof ApiError ? err.code : undefined) })
  } finally {
    if (runs.get(id) === ctrl) runs.delete(id)
  }
  // Messages sent while the agent worked go out one by one once it finishes.
  const s = get(id)
  if (!s.working && !s.approval && s.queue.length) {
    dispatch(id, { type: 'dequeue' })
    send(id, s.queue[0]!)
  }
}

export function send(id: string, text: string, attachment?: string) {
  const s = get(id)
  if (s.working) return dispatch(id, { type: 'queue', text })
  if (s.approval) {
    // Talking instead of picking answers with the last ("직접 말하기") choice.
    const first = s.approval.sections.find((x) => x.kind === 'choices')
    return answer(id, text, first && first.kind === 'choices' ? first.items.length - 1 : 0)
  }
  dispatch(id, { type: 'user', id: `u-${Date.now()}`, text, attachment })
  void startRun({ conversationId: id, text, interrupted: s.interrupted })
}

export function answer(id: string, text: string, choice: number) {
  const approval = get(id).approval
  if (!approval) return
  dispatch(id, { type: 'answer', text })
  void startRun({ conversationId: id, text, answer: { approvalId: approval.id, choice } })
}

export function stop(id: string) {
  runs.get(id)?.abort()
  dispatch(id, { type: 'stop' })
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
}

/** Loads saved messages once for a conversation this session hasn't seen yet. */
export async function hydrate(id: string) {
  if (get(id).items.length || runs.has(id)) return
  const res = await api.conversations.messages(id, { limit: 50 })
  // push-be pages newest first; the transcript reads oldest first.
  for (const m of [...res.data].reverse()) {
    dispatch(id, m.role === 'USER' ? { type: 'user', id: m.id, text: m.text } : { type: 'agentText', id: m.id, text: m.text })
  }
}

export const forget = (id: string) =>
  useChatStore.setState((s) => {
    const { [id]: _, ...rest } = s.chats
    return { chats: rest }
  })
