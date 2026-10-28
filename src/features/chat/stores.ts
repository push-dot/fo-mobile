import { create } from 'zustand'
import { ApiError, QueueBusyError, type AccessMode } from '@push/api-client'
import { API_MOCK, hapticImpactLight, hapticNotify } from '@/shared/infrastructure'
import {
  chatApi,
  fetchConversationMessages,
  followConversation,
  resolveConversationApproval,
  streamConversation,
  updateAiAccessMode,
} from './api/fetchers'
import type { RunInput } from './api/schemas'
import { DEFAULT_ACCESS_MODE } from './constants'
import { applyEvent, emptyChat } from './utils/reducer'
import { errorText, fromStream } from './utils/stream'
import type { ChatEvent, ChatState } from './types'

// Runs live outside React so they keep going when the conversation screen closes (feature-spec 2).
export const useChatStore = create<{ chats: Record<string, ChatState> }>(() => ({ chats: {} }))
export const useChat = (id: string) => useChatStore((s) => s.chats[id] ?? emptyChat)

export const usePrefs = create<{ accessMode: AccessMode }>(() => ({ accessMode: DEFAULT_ACCESS_MODE }))

export const pickAccessMode = async (mode: AccessMode) => {
  const prev = usePrefs.getState().accessMode
  usePrefs.setState({ accessMode: mode })
  try {
    return await updateAiAccessMode(mode)
  } catch (err) {
    usePrefs.setState({ accessMode: prev })
    throw err
  }
}

const get = (id: string) => useChatStore.getState().chats[id] ?? emptyChat
const runs = new Map<string, AbortController>()

const dispatch = (id: string, e: ChatEvent) => {
  useChatStore.setState((s) => ({ chats: { ...s.chats, [id]: applyEvent(s.chats[id] ?? emptyChat, e) } }))
  if (e.type === 'approval') void hapticImpactLight()
  if (e.type === 'done') void hapticNotify('success')
  if (e.type === 'error') void hapticNotify('warning')
}

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms)
    signal.addEventListener('abort', () => (clearTimeout(t), reject(new Error('aborted'))), { once: true })
  })

const scripted = async function* (input: RunInput, signal: AbortSignal): AsyncGenerator<ChatEvent> {
  for (const step of await chatApi.run(input)) {
    await sleep(step.wait, signal)
    yield step.event
  }
}

const streamed = (input: RunInput, signal: AbortSignal): AsyncGenerator<ChatEvent> => {
  const id = input.conversationId
  const body = { text: input.text ?? '', accessMode: usePrefs.getState().accessMode }
  return fromStream(streamConversation(id, body, signal), (after) => followConversation(id, after, signal))
}

const resolved = async function* (input: RunInput, signal: AbortSignal): AsyncGenerator<ChatEvent> {
  const id = input.conversationId
  const { approvalId, optionId } = input.resolve!
  const r = await resolveConversationApproval(id, approvalId, optionId)
  if (!r.jobId) return
  yield* fromStream(followConversation(id, undefined, signal), (after) => followConversation(id, after, signal))
}

const startRun = async (input: RunInput) => {
  const id = input.conversationId
  const ctrl = new AbortController()
  runs.set(id, ctrl)
  dispatch(id, { type: 'start', at: Date.now() })
  try {
    for await (const e of (input.resolve ? resolved : API_MOCK ? scripted : streamed)(input, ctrl.signal)) {
      dispatch(id, e.type === 'done' ? { ...e, at: Date.now() } : e)
    }
    if (get(id).working) dispatch(id, { type: 'done', at: Date.now() })
  } catch (err) {
    if (ctrl.signal.aborted) return
    const text = errorText(err instanceof ApiError ? err.code : undefined, err instanceof QueueBusyError ? err.retryAfterSec : undefined)
    dispatch(id, { type: 'error', id: `err-${Date.now()}`, text })
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

export const send = (id: string, text: string, attachment?: string) => {
  const s = get(id)
  if (s.working) return dispatch(id, { type: 'queue', text })
  if (s.approval?.optionIds) {
    // The server reads free text as the gate answer or as rejecting the pending approval.
    dispatch(id, { type: 'answer', text })
    return void startRun({ conversationId: id, text })
  }
  if (s.approval) {
    // Talking instead of picking answers with the last ("직접 말하기") choice.
    const first = s.approval.sections.find((x) => x.kind === 'choices')
    return answer(id, text, first && first.kind === 'choices' ? first.items.length - 1 : 0)
  }
  dispatch(id, { type: 'user', id: `u-${Date.now()}`, text, attachment })
  void startRun({ conversationId: id, text, interrupted: s.interrupted })
}

export const answer = (id: string, text: string, choice: number) => {
  const approval = get(id).approval
  if (!approval) return
  dispatch(id, { type: 'answer', text })
  const optionId = approval.optionIds?.[choice]
  if (approval.optionIds && !optionId) return void startRun({ conversationId: id, text })
  void startRun(
    optionId
      ? { conversationId: id, text, resolve: { approvalId: approval.id, optionId } }
      : { conversationId: id, text, answer: { approvalId: approval.id, choice } },
  )
}

export const stop = (id: string) => {
  runs.get(id)?.abort()
  dispatch(id, { type: 'stop' })
  void hapticNotify('warning')
}

export const hydrate = async (id: string) => {
  if (get(id).items.length || runs.has(id)) return
  const res = await fetchConversationMessages(id)
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
