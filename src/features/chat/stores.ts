import { create } from 'zustand'
import { ApiError, QueueBusyError, type AccessMode, type BotContract, type ChatIntent } from '@push/api-client'
import { myApi } from '@/features/my/api/fetchers'
import type { PickedFile } from '@/features/my/types'
import { queryClient } from '@/providers/query-client'
import { showToast } from '@/shared/components/toast-store'
import { API_MOCK, botApi, hapticImpactLight, hapticNotify } from '@/shared/infrastructure'
import { chatApi, updateAiAccessMode } from './api/fetchers'
import type { RunInput } from './api/schemas'
import { CHAT_STOP_FAILED, CHAT_STOP_FORBIDDEN, DEFAULT_ACCESS_MODE, UPLOAD_ERROR_TEXT } from './constants'
import { applyEvent, emptyChat } from './utils/reducer'
import { createTokenBatch } from './utils/token-batch'
import { isConsentRequired } from './utils/consent'
import { errorText, fromStream, type StreamEnd } from './utils/stream'
import { openPieceId, restoreBotTurns } from './utils/turns'
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

type Outgoing = RunInput & { file?: PickedFile; reattach?: boolean }

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

const pendingConsent = new Map<string, RunInput>()
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
  pendingConsent.clear()
  pendingOpen = null
  useConsentPrompt.setState({ open: false, dismissed: true })
}

export const consentTurnedOff = () => useConsentPrompt.setState({ dismissed: false, open: false })

export const grantConsent = () => {
  useConsentPrompt.setState({ open: false, dismissed: true })
  const held = [...pendingConsent.values()]
  pendingConsent.clear()
  const open = pendingOpen
  pendingOpen = null
  if (held.length) {
    for (const next of held) void startRun(next)
  } else if (open) openChat?.(open)
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

type Held = { text: string; file?: PickedFile; attachment?: string; intent?: ChatIntent; context?: RunInput['context'] }
const heldQueues = new Map<string, Held[]>()

const botIntent = (intent?: ChatIntent): BotContract.Intent | undefined =>
  intent && intent !== 'posting' && intent !== 'review' && intent !== 'interview' && intent !== 'general' ? intent : undefined

const attachmentsOf = (input: RunInput): BotContract.AttachmentRef[] => [
  ...(input.context?.documentId ? [{ kind: 'document' as const, id: input.context.documentId }] : []),
  ...(input.context?.evidenceIds ?? []).map((id) => ({ kind: 'file' as const, id })),
]

const setChatEvent = (id: string, e: ChatEvent) => {
  useChatStore.setState((s) => ({ chats: { ...s.chats, [id]: applyEvent(s.chats[id] ?? emptyChat, e) } }))
  if (e.type === 'approval') void hapticImpactLight()
  if (e.type === 'done') void hapticNotify('success')
  if (e.type === 'error') void hapticNotify('warning')
}

const schedule =
  typeof requestAnimationFrame === 'function'
    ? (fn: () => void) => requestAnimationFrame(fn)
    : (fn: () => void) => setTimeout(fn, 16)

const tokenBatch = createTokenBatch(
  (id, text) => setChatEvent(id, { type: 'token', text }),
  schedule,
)

const dispatch = (id: string, e: ChatEvent) => {
  if (e.type === 'token') {
    tokenBatch.push(id, e.text)
    return
  }
  tokenBatch.flushNow(id)
  setChatEvent(id, e)
}

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms)
    signal.addEventListener('abort', () => (clearTimeout(t), reject(new Error('aborted'))), { once: true })
  })

// The mock answers a run with its frames at once and the app plays them on the clock, because RN cannot stream a synthetic body.
// They go through the live stream's mapper, so a mock run draws what the server's frames would.
const scripted = async function* (input: RunInput, signal: AbortSignal, end?: StreamEnd): AsyncGenerator<ChatEvent> {
  const steps = await chatApi.run(input)
  const frames = async function* () {
    for (const step of steps) {
      await sleep(step.wait, signal)
      yield step.frame
    }
  }
  yield* fromStream(frames(), async function* () {}, end)
}

const remember = async function* <T extends { seq?: number }>(source: AsyncIterable<T>, seen: { seq?: number }): AsyncGenerator<T> {
  for await (const ev of source) {
    if (typeof ev.seq === 'number') seen.seq = ev.seq
    yield ev
  }
}

const streamed = (input: RunInput, signal: AbortSignal, end: StreamEnd | undefined, seen: { seq?: number }): AsyncGenerator<ChatEvent> => {
  const intent = botIntent(input.intent)
  const attachments = attachmentsOf(input)
  const body: BotContract.SendBody = {
    text: input.text ?? '',
    accessMode: usePrefs.getState().accessMode,
    ...(intent ? { intent } : {}),
    ...(attachments.length ? { attachments } : {}),
  }
  return fromStream(
    remember(botApi.bots.send(input.conversationId, body, signal), seen),
    (after) => remember(botApi.bots.follow(input.conversationId, after, signal), seen),
    end,
  )
}

const followed = (input: RunInput, signal: AbortSignal, end: StreamEnd | undefined, seen: { seq?: number }) =>
  fromStream(
    remember(botApi.bots.follow(input.conversationId, input.after, signal), seen),
    (after) => remember(botApi.bots.follow(input.conversationId, after, signal), seen),
    end,
    input.piece,
  )

const resolved = async function* (input: RunInput, signal: AbortSignal, end: StreamEnd | undefined, seen: { seq?: number }): AsyncGenerator<ChatEvent> {
  const { approvalId, optionId, optionIds } = input.resolve!
  const body = optionIds?.length ? { optionId, optionIds } : { optionId }
  const { resumed } = await botApi.bots.answer(input.conversationId, approvalId, body)
  if (!resumed) return
  yield* followed(input, signal, end, seen)
}

const clearWorking = (id: string) => {
  useChatStore.setState((s) => {
    const cur = s.chats[id]
    if (!cur) return s
    return { chats: { ...s.chats, [id]: { ...cur, working: null, runStartedAt: null } } }
  })
}

const launch = (id: string, next: Held) => {
  dispatch(id, { type: 'user', id: `u-${Date.now()}`, text: next.text, attachment: next.attachment })
  void startRun({
    conversationId: id,
    text: next.text,
    attachment: next.attachment,
    file: next.file,
    interrupted: get(id).interrupted,
    intent: next.intent,
    context: next.context,
  })
}

const flush = (id: string) => {
  const s = get(id)
  const q = heldQueues.get(id)
  if (!q?.length || s.working || s.approval || runs.has(id)) return
  const next = q.shift()!
  if (!q.length) heldQueues.delete(id)
  dispatch(id, { type: 'dequeue' })
  launch(id, next)
}

const startRun = async (input: Outgoing) => {
  const id = input.conversationId
  const ctrl = new AbortController()
  runs.set(id, ctrl)
  dispatch(id, { type: 'start', at: Date.now() })
  const end: StreamEnd = { reason: 'no-seq' }
  const seen: { seq?: number } = {}
  let release = false
  let run: RunInput | undefined
  try {
    run = await withUpload(input)
    if (!run) {
      dispatch(id, { type: 'error', id: `err-${Date.now()}`, text: UPLOAD_ERROR_TEXT })
      release = true
    } else {
      const events = API_MOCK
        ? scripted(run, ctrl.signal, end)
        : run.resolve
          ? resolved(run, ctrl.signal, end, seen)
          : run.follow
            ? followed(run, ctrl.signal, end, seen)
            : streamed(run, ctrl.signal, end, seen)
      for await (const e of events) {
        dispatch(id, e.type === 'done' ? { ...e, at: Date.now() } : e)
      }
      if (end.reason === 'reattach-empty') {
        clearWorking(id)
        release = true
      } else if (end.reason === 'terminal') release = true
    }
  } catch (err) {
    if (ctrl.signal.aborted) return
    if (isConsentRequired(err)) {
      pendingConsent.set(id, run ?? posted(input))
      clearWorking(id)
      askConsent(true)
      return
    }
    const apiError = err instanceof ApiError ? err : undefined
    if (!apiError) {
      if (seen.seq !== undefined && !input.reattach) {
        void startRun({ conversationId: id, follow: true, after: seen.seq, piece: input.piece, reattach: true })
        return
      }
      if (input.reattach) return
      dispatch(id, { type: 'error', id: `err-${Date.now()}`, text: errorText() })
      return
    }
    const retryAfter = err instanceof QueueBusyError ? err.retryAfterSec : apiError.details?.retryAfterSec
    const text = errorText(apiError.code, typeof retryAfter === 'number' ? retryAfter : undefined, apiError.details?.reason)
    dispatch(id, { type: 'error', id: `err-${Date.now()}`, text, code: apiError.code })
    release = true
  } finally {
    if (runs.get(id) === ctrl) runs.delete(id)
  }
  if (release) flush(id)
}

const fileOf = (attachment?: string | PickedFile) => (typeof attachment === 'string' || !attachment ? undefined : attachment)

const nameOf = (attachment?: string | PickedFile) => (typeof attachment === 'string' ? attachment : attachment?.name)

export const send = (id: string, text: string, attachment?: string | PickedFile, intent?: ChatIntent, context?: RunInput['context']) => {
  const s = get(id)
  if (s.working || runs.has(id) || (heldQueues.get(id)?.length ?? 0) > 0) {
    const file = fileOf(attachment)
    const q = heldQueues.get(id) ?? []
    q.push({ text, file, attachment: nameOf(attachment), intent, context })
    heldQueues.set(id, q)
    dispatch(id, { type: 'queue', text, ...(file ? { file } : {}) })
    if (!s.working && !s.approval && !runs.has(id)) flush(id)
    return
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
  launch(id, { text, file: fileOf(attachment), attachment: nameOf(attachment), intent, context })
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
  const optionId = ids[0]
  if (!optionId) return void startRun({ conversationId: id, text })
  void startRun({ conversationId: id, text, resolve: { approvalId: approval.id, optionId, ...(ids.length > 1 ? { optionIds: ids } : {}) } })
}

const halting = new Set<string>()

const finishStop = (id: string, ctrl: AbortController | undefined) => {
  halting.delete(id)
  if (ctrl && runs.get(id) !== ctrl) return
  if (API_MOCK) ctrl?.abort()
  dispatch(id, { type: 'stop' })
}

const reportCancel = (id: string) => {
  const ctrl = runs.get(id)
  if (API_MOCK) {
    finishStop(id, ctrl)
    return
  }
  if (halting.has(id)) return
  halting.add(id)
  void botApi.bots.cancel(id).then(
    () => finishStop(id, ctrl),
    (error: unknown) => {
      if (error instanceof ApiError && error.status === 409) {
        finishStop(id, ctrl)
        return
      }
      halting.delete(id)
      showToast({ message: error instanceof ApiError && error.status === 403 ? CHAT_STOP_FORBIDDEN : CHAT_STOP_FAILED })
    },
  )
}

export const stop = (id: string) => {
  void hapticNotify('warning')
  reportCancel(id)
}

const busy = (id: string) => runs.has(id) || !!get(id).working || get(id).items.length > 0

export const openBot = async (address: string) => {
  const id = address === 'push' ? (await botApi.bots.get(address)).id : address
  if (busy(id)) return id
  const page = await botApi.bots.transcript(id)
  if (busy(id)) return id
  useChatStore.setState((s) => ({ chats: { ...s.chats, [id]: restoreBotTurns(page.data, page.live) } }))
  if (page.live && !API_MOCK) void startRun({ conversationId: id, follow: true, after: page.live.lastSeq, piece: openPieceId(page.data, page.live) })
  return id
}

export const forget = (id: string) =>
  useChatStore.setState((s) => {
    const { [id]: _, ...rest } = s.chats
    return { chats: rest }
  })
