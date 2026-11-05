import { create } from 'zustand'
import { ApiError, QueueBusyError, type AccessMode, type ChatIntent } from '@push/api-client'
import { myApi, type PickedFile } from '@/features/my'
import { queryClient } from '@/providers/query-client'
import { API_MOCK, hapticImpactLight, hapticNotify } from '@/shared/infrastructure'
import {
  chatApi,
  fetchConversationMessages,
  fetchConversationTurns,
  followConversation,
  resolveConversationApproval,
  streamConversation,
  updateAiAccessMode,
} from './api/fetchers'
import type { RunInput } from './api/schemas'
import { DEFAULT_ACCESS_MODE, UPLOAD_ERROR_TEXT } from './constants'
import { applyEvent, emptyChat } from './utils/reducer'
import { isConsentRequired } from './utils/consent'
import { errorText, fromStream } from './utils/stream'
import { restoreTurns } from './utils/turns'
import type { ChatEvent, ChatState } from './types'

// Runs live outside React so they keep going when the conversation screen closes (feature-spec 2).
export const useChatStore = create<{ chats: Record<string, ChatState> }>(() => ({ chats: {} }))
export const useChat = (id: string) => useChatStore((s) => s.chats[id] ?? emptyChat)

export const usePrefs = create<{ accessMode: AccessMode }>(() => ({ accessMode: DEFAULT_ACCESS_MODE }))

export const useConsentPrompt = create<{ open: boolean; dismissed: boolean }>(() => ({ open: false, dismissed: false }))

/** 자료 고르기 sheet writes back into the composer. File picks stay in the composer. */
export const useMaterialBridge = create<{ text: string | null; file: number }>(() => ({ text: null, file: 0 }))
export const submitMaterialText = (text: string) => useMaterialBridge.setState({ text })
export const requestMaterialFile = () => useMaterialBridge.setState((s) => ({ file: s.file + 1 }))

type PendingOpen = { title: string; message: string; attachment?: string | PickedFile; intent?: ChatIntent; context?: RunInput['context'] }

type Outgoing = RunInput & { file?: PickedFile }

const posted = ({ file: _, ...rest }: Outgoing): RunInput => rest

const withUpload = async (input: Outgoing): Promise<RunInput | undefined> => {
  if (!input.file || API_MOCK) return posted(input)
  try {
    const source = await myApi.upload(input.file)
    void queryClient.invalidateQueries({ queryKey: ['me', 'sources'] })
    return posted({ ...input, context: { ...input.context, evidenceIds: [source.id] } })
  } catch {
    return undefined
  }
}

let pendingConsent: RunInput | null = null
let pendingOpen: PendingOpen | null = null
let openChat: ((p: PendingOpen) => void) | null = null

export const askConsent = (force = false) => {
  const s = useConsentPrompt.getState()
  if (!(force || !s.dismissed) || s.open) return
  useConsentPrompt.setState({ open: true })
}

export const holdOpen = (p: PendingOpen) => {
  pendingOpen = p
}

export const bindOpenChat = (fn: (p: PendingOpen) => void) => {
  openChat = fn
}

export const laterConsent = () => {
  pendingConsent = null
  pendingOpen = null
  useConsentPrompt.setState({ open: false, dismissed: true })
}

export const consentTurnedOff = () => useConsentPrompt.setState({ dismissed: false, open: false })

export const grantConsent = () => {
  useConsentPrompt.setState({ open: false, dismissed: true })
  const next = pendingConsent
  pendingConsent = null
  const open = pendingOpen
  pendingOpen = null
  if (next) void startRun(next)
  else if (open) openChat?.(open)
}

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
  const documentId = input.context?.documentId
  const evidenceIds = input.context?.evidenceIds
  const context = {
    ...(documentId ? { documentId } : {}),
    ...(evidenceIds?.length ? { evidenceIds } : {}),
  }
  const body = {
    text: input.text ?? '',
    accessMode: usePrefs.getState().accessMode,
    ...(input.intent ? { intent: input.intent } : {}),
    ...(documentId || evidenceIds?.length ? { context } : {}),
  }
  return fromStream(streamConversation(id, body, signal), (after) => followConversation(id, after, signal))
}

const resolved = async function* (input: RunInput, signal: AbortSignal): AsyncGenerator<ChatEvent> {
  const id = input.conversationId
  const { approvalId, optionId, optionIds } = input.resolve!
  const r = optionIds?.length
    ? await resolveConversationApproval(id, approvalId, optionId, optionIds)
    : await resolveConversationApproval(id, approvalId, optionId)
  if (!r.jobId) return
  yield* followed(input, signal)
}

const followed = (input: RunInput, signal: AbortSignal) =>
  fromStream(followConversation(input.conversationId, undefined, signal), (after) => followConversation(input.conversationId, after, signal))

const startRun = async (input: Outgoing) => {
  const id = input.conversationId
  const ctrl = new AbortController()
  runs.set(id, ctrl)
  dispatch(id, { type: 'start', at: Date.now() })
  let run: RunInput | undefined
  try {
    run = await withUpload(input)
    if (!run) {
      dispatch(id, { type: 'error', id: `err-${Date.now()}`, text: UPLOAD_ERROR_TEXT })
    } else {
      for await (const e of (run.resolve ? resolved : run.follow ? followed : API_MOCK ? scripted : streamed)(run, ctrl.signal)) {
        dispatch(id, e.type === 'done' ? { ...e, at: Date.now() } : e)
      }
      if (get(id).working) dispatch(id, { type: 'done', at: Date.now() })
    }
  } catch (err) {
    if (ctrl.signal.aborted) return
    if (isConsentRequired(err)) {
      pendingConsent = run ?? posted(input)
      useChatStore.setState((s) => {
        const cur = s.chats[id]
        if (!cur) return s
        return { chats: { ...s.chats, [id]: { ...cur, working: null, runStartedAt: null } } }
      })
      askConsent(true)
      return
    }
    const text = errorText(err instanceof ApiError ? err.code : undefined, err instanceof QueueBusyError ? err.retryAfterSec : undefined)
    dispatch(id, { type: 'error', id: `err-${Date.now()}`, text, code: err instanceof ApiError ? err.code : undefined })
  } finally {
    if (runs.get(id) === ctrl) runs.delete(id)
  }
  // Messages sent while the agent worked go out one by one once it finishes.
  const s = get(id)
  if (!s.working && !s.approval && s.queue.length) {
    const next = s.queue[0]!
    dispatch(id, { type: 'dequeue' })
    send(id, next.text, next.file)
  }
}

const fileOf = (attachment?: string | PickedFile) => (typeof attachment === 'string' || !attachment ? undefined : attachment)

const nameOf = (attachment?: string | PickedFile) => (typeof attachment === 'string' ? attachment : attachment?.name)

export const send = (id: string, text: string, attachment?: string | PickedFile, intent?: ChatIntent, context?: RunInput['context']) => {
  const s = get(id)
  if (s.working) {
    const file = fileOf(attachment)
    return dispatch(id, { type: 'queue', text, ...(file ? { file } : {}) })
  }
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
  const name = nameOf(attachment)
  dispatch(id, { type: 'user', id: `u-${Date.now()}`, text, attachment: name })
  void startRun({ conversationId: id, text, attachment: name, file: fileOf(attachment), interrupted: s.interrupted, intent, context })
}

export const answer = (id: string, text: string, choice: number | number[]) => {
  const approval = get(id).approval
  if (!approval) return
  const picks = Array.isArray(choice) ? choice : [choice]
  dispatch(id, { type: 'answer', text })
  const ids = picks.flatMap((n) => {
    const optionId = approval.optionIds?.[n]
    return optionId ? [optionId] : []
  })
  if (approval.optionIds && !ids.length) return void startRun({ conversationId: id, text })
  const optionId = ids[0]
  void startRun(
    optionId
      ? { conversationId: id, text, resolve: { approvalId: approval.id, optionId, ...(ids.length > 1 ? { optionIds: ids } : {}) } }
      : { conversationId: id, text, answer: { approvalId: approval.id, choice: picks[0] ?? 0 } },
  )
}

export const stop = (id: string) => {
  runs.get(id)?.abort()
  dispatch(id, { type: 'stop' })
  void hapticNotify('warning')
}

const busy = (id: string) => get(id).items.length > 0 || runs.has(id)

export const hydrate = async (id: string) => {
  if (busy(id)) return
  const [res, turns] = await Promise.all([fetchConversationMessages(id), fetchConversationTurns(id).catch(() => null)])
  if (busy(id)) return
  const [newest, ...older] = turns?.data ?? []
  if (newest) {
    // Joined tokens keep their first seq, so a running job is replayed whole instead of resumed after it.
    const active = newest.status === 'RUNNING' || newest.status === 'PENDING'
    const chat = restoreTurns([active ? { ...newest, events: [] } : newest, ...older], res.data)
    useChatStore.setState((s) => ({ chats: { ...s.chats, [id]: chat } }))
    if (active && !API_MOCK) void startRun({ conversationId: id, follow: true })
    return
  }
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
