import { create } from 'zustand'
import { ApiError, QueueBusyError, type A2uiAnswerContext, type BotContract, type ChatIntent } from '@push/api-client'
import type { Attachment, AttachmentKind, BotId, LocalActivity } from '@/features/bots'
import { queryClient } from '@/providers/query-client'
import { showToast } from '@/shared/components/toast-store'
import { onSessionCleared } from '@/shared/utility/session-reset'
import { API_MOCK, botApi, hapticImpactLight, hapticNotify, mockUploadFailing } from '@/shared/infrastructure'
import { sourcesApi, type PickedFile } from '@/shared/infrastructure/sources'
import { chatApi } from './api/fetchers'
import type { RunInput } from './api/schemas'
import { CHAT_STOP_FAILED, CHAT_STOP_FORBIDDEN, DISCONNECT_REASON, GATED_STEP, STOPPING_TEXT, UPLOAD_ERROR_CODE, UPLOAD_ERROR_TEXT } from './constants'
import type { ChatEvent, ChatItem, ChatState, ReviewPageRequest } from './types'
import { isConsentRequired } from '@/shared/utility/consent-error'
import { fromFirst, prependOlder } from './utils/find'
import { applyEvent, emptyChat } from './utils/reducer'
import { isStopping } from './utils/status-line'
import { errorText, fromStream, type StreamEnd } from './utils/stream'
import { createTokenBatch } from './utils/token-batch'
import { openPieceId, restoreBotTurns } from './utils/turns'
import { withMaterial } from './utils/usage'

export const useConsentPrompt = create<{ open: boolean; dismissed: boolean }>(() => ({ open: false, dismissed: false }))

export type PendingOpen = { title: string; message: string; attachment?: string | PickedFile; intent?: ChatIntent; context?: RunInput['context'] }

export const pendingConsent = new Map<string, RunInput>()
let pendingOpen: PendingOpen | null = null
let pendingRetry: (() => void) | null = null
let openChat: ((p: PendingOpen) => void) | null = null

export const askConsent = (force = false) => {
  const s = useConsentPrompt.getState()
  if (!(force || !s.dismissed) || s.open) return
  useConsentPrompt.setState({ open: true })
}

export const askConsentThen = (retry: () => void) => {
  pendingRetry = retry
  askConsent(true)
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
  pendingRetry = null
  useConsentPrompt.setState({ open: false, dismissed: true })
}

export const consentTurnedOff = () => useConsentPrompt.setState({ dismissed: false, open: false })

export const takeConsent = () => {
  useConsentPrompt.setState({ open: false, dismissed: true })
  const held = [...pendingConsent.values()]
  pendingConsent.clear()
  const open = pendingOpen
  pendingOpen = null
  const retry = pendingRetry
  pendingRetry = null
  return { held, open, retry, openChat }
}

export const resetConsent = () => {
  pendingConsent.clear()
  pendingOpen = null
  pendingRetry = null
  useConsentPrompt.setState({ open: false, dismissed: false })
}

export const LOCAL_DRAFT = 'local'

type Draft = { text: string; file?: PickedFile; chip?: string; chipKind?: AttachmentKind; chipId?: string }

const EMPTY_DRAFT: Draft = { text: '' }

export const useDraftStore = create<{ byBot: Record<string, Draft> }>(() => ({ byBot: {} }))

const writeDraft = (id: string, next: Draft | undefined) => {
  useDraftStore.setState((s) => {
    if (!next) {
      if (!s.byBot[id]) return s
      const { [id]: _, ...rest } = s.byBot
      return { byBot: rest }
    }
    return { byBot: { ...s.byBot, [id]: next } }
  })
}

export const setDraftText = (id: string, text: string) => {
  useDraftStore.setState((s) => {
    const current = s.byBot[id] ?? EMPTY_DRAFT
    if (!text && !current.file && !current.chip) {
      if (!s.byBot[id]) return s
      const { [id]: _, ...rest } = s.byBot
      return { byBot: rest }
    }
    return { byBot: { ...s.byBot, [id]: { ...current, text } } }
  })
}

export const appendDraftText = (id: string, text: string) => {
  useDraftStore.setState((s) => ({ byBot: withMaterial(s.byBot, id, text, EMPTY_DRAFT) }))
}

export const attachDraftFile = (id: string, file: PickedFile) => {
  useDraftStore.setState((s) => {
    const current = s.byBot[id] ?? EMPTY_DRAFT
    return { byBot: { ...s.byBot, [id]: { ...current, file, chip: undefined, chipKind: undefined, chipId: undefined } } }
  })
}

export const attachDraftChip = (id: string, chip: string, chipKind: AttachmentKind, chipId?: string) => {
  useDraftStore.setState((s) => {
    const current = s.byBot[id] ?? EMPTY_DRAFT
    return { byBot: { ...s.byBot, [id]: { ...current, chip, chipKind, chipId, file: undefined } } }
  })
}

export const detachDraft = (id: string) => {
  useDraftStore.setState((s) => {
    const current = s.byBot[id]
    if (!current) return s
    if (!current.text) {
      const { [id]: _, ...rest } = s.byBot
      return { byBot: rest }
    }
    return { byBot: { ...s.byBot, [id]: { text: current.text } } }
  })
}

export const clearDraft = (id: string) => writeDraft(id, undefined)

export const attach = (botId: BotId, attachment: Attachment) => attachDraftChip(botId, attachment.title, attachment.kind, attachment.id)

export const resetDrafts = () => useDraftStore.setState({ byBot: {} })

export const useChatStore = create<{ chats: Record<string, ChatState> }>(() => ({ chats: {} }))
type Outgoing = RunInput & { file?: PickedFile; reattach?: boolean }

const posted = ({ file: _, ...rest }: Outgoing): RunInput => rest

const withUpload = async (input: Outgoing): Promise<RunInput | undefined> => {
  if (!input.file) return posted(input)
  if (API_MOCK) return mockUploadFailing() ? undefined : posted(input)
  try {
    const source = await sourcesApi.upload(input.file)
    void queryClient.invalidateQueries({ queryKey: ['me', 'sources'] })
    return posted({ ...input, context: { ...input.context, evidenceIds: [source.id] } })
  } catch {
    return undefined
  }
}

export const grantConsent = () => {
  const { held, open, retry, openChat } = takeConsent()
  retry?.()
  if (held.length) {
    for (const next of held) void startRun(next)
  } else if (open) openChat?.(open)
}

const get = (id: string) => useChatStore.getState().chats[id] ?? emptyChat
const runs = new Map<string, AbortController>()

type Held = { text: string; file?: PickedFile; attachment?: string; intent?: ChatIntent; context?: RunInput['context'] }
const heldQueues = new Map<string, Held[]>()

const botIntent = (intent?: ChatIntent): BotContract.Intent | undefined =>
  intent && intent !== 'posting' && intent !== 'review' && intent !== 'interview' && intent !== 'general' ? intent : undefined

const attachmentsOf = (input: RunInput): BotContract.AttachmentRef[] => [
  ...(input.context?.documentId ? [{ kind: 'document' as const, id: input.context.documentId }] : []),
  ...(input.context?.materials ?? []),
  ...(input.context?.evidenceIds ?? []).map((id) => ({ kind: 'file' as const, id })),
]

const setChatEvent = (id: string, e: ChatEvent) => {
  useChatStore.setState((s) => ({ chats: { ...s.chats, [id]: applyEvent(s.chats[id] ?? emptyChat, e) } }))
  if (e.type === 'wait') void hapticImpactLight()
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
  if (e.type === 'agentText' && e.undo) void queryClient.invalidateQueries({ queryKey: ['me', 'profile'] })
  if (e.type === 'token') {
    tokenBatch.push(id, e.text)
    return
  }
  tokenBatch.flushNow(id)
  setChatEvent(id, e)
  if (e.type === 'done') void queryClient.invalidateQueries({ queryKey: ['chat', 'account'] })
}

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms)
    signal.addEventListener('abort', () => (clearTimeout(t), reject(new Error('aborted'))), { once: true })
  })

let openGate: (() => void) | null = null
export const nextMockStep = () => openGate?.()
let holdStop = false
export const holdMockStop = () => {
  holdStop = true
}
const gated = (signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    openGate = () => {
      openGate = null
      resolve()
    }
    signal.addEventListener('abort', () => openGate?.(), { once: true })
  })

const scripted = async function* (input: RunInput, signal: AbortSignal, end?: StreamEnd): AsyncGenerator<ChatEvent> {
  const steps = await chatApi.run(input)
  const frames = async function* () {
    for (const step of steps) {
      if (step.wait === GATED_STEP) await gated(signal)
      else await sleep(step.wait, signal)
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
  let resumed: boolean
  try {
    resumed = (await botApi.bots.answer(input.conversationId, approvalId, body)).resumed
  } catch (err) {
    yield { type: 'reopen', surfaceId: approvalId }
    throw err
  }
  if (!resumed) return
  yield* followed(input, signal, end, seen)
}

const streamingPiece = (id: string) => {
  const last = get(id).items.at(-1)
  return last?.type === 'agentText' ? last.id : undefined
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
  if (!q?.length || s.working || s.waiting || runs.has(id)) return
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
    if (ctrl.signal.aborted) return
    if (!run) {
      dispatch(id, { type: 'error', id: `err-${Date.now()}`, text: UPLOAD_ERROR_TEXT, code: UPLOAD_ERROR_CODE })
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
        if (ctrl.signal.aborted) return
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
        void startRun({ conversationId: id, follow: true, after: seen.seq, piece: streamingPiece(id) ?? input.piece, reattach: true })
        return
      }
      dispatch(id, { type: 'error', id: `err-${Date.now()}`, text: errorText(), reason: DISCONNECT_REASON })
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

const chipMaterial = (id: string, attachment?: string | PickedFile): BotContract.AttachmentRef | undefined => {
  const d = useDraftStore.getState().byBot[id]
  return typeof attachment === 'string' && d?.chip === attachment && d.chipId && d.chipKind ? { kind: d.chipKind, id: d.chipId } : undefined
}

export const send = (id: string, text: string, attachment?: string | PickedFile, intent?: ChatIntent, context?: RunInput['context']) => {
  const material = chipMaterial(id, attachment)
  if (material) context = { ...context, materials: [...(context?.materials ?? []), material] }
  const s = get(id)
  if (s.working || runs.has(id) || (heldQueues.get(id)?.length ?? 0) > 0) {
    const file = fileOf(attachment)
    const q = heldQueues.get(id) ?? []
    q.push({ text, file, attachment: nameOf(attachment), intent, context })
    heldQueues.set(id, q)
    dispatch(id, { type: 'queue', text, ...(file ? { file } : {}) })
    if (!s.working && !s.waiting && !runs.has(id)) flush(id)
    return
  }
  if (s.waiting) {
    dispatch(id, { type: 'answer', surfaceId: s.waiting, picked: [] })
    launch(id, { text, file: fileOf(attachment), attachment: nameOf(attachment), intent, context })
    return
  }
  launch(id, { text, file: fileOf(attachment), attachment: nameOf(attachment), intent, context })
}

export const answerSurface = (id: string, surfaceId: string, body: A2uiAnswerContext) => {
  if (get(id).waiting !== surfaceId) return
  dispatch(id, { type: 'answer', surfaceId, picked: body.optionIds ?? [body.optionId] })
  void startRun({ conversationId: id, resolve: { approvalId: surfaceId, optionId: body.optionId, ...(body.optionIds ? { optionIds: body.optionIds } : {}) } })
}

const halting = new Set<string>()

const finishStop = (id: string, ctrl: AbortController | undefined, resumable: boolean) => {
  halting.delete(id)
  if (ctrl && runs.get(id) !== ctrl) return
  if (API_MOCK) ctrl?.abort()
  dispatch(id, { type: 'stop', resumable })
}

const reportCancel = (id: string) => {
  const ctrl = runs.get(id)
  if (API_MOCK) {
    const resumable = get(id).items.some((item) => item.type === 'surface' && item.kind === 'todo')
    if (holdStop) {
      holdStop = false
      dispatch(id, { type: 'status', verbs: [STOPPING_TEXT] })
      openGate = () => {
        openGate = null
        finishStop(id, ctrl, resumable)
      }
      return
    }
    finishStop(id, ctrl, resumable)
    return
  }
  if (halting.has(id)) return
  halting.add(id)
  const before = get(id).working?.verbs
  dispatch(id, { type: 'status', verbs: [STOPPING_TEXT] })
  void botApi.bots.cancel(id).then(
    (result) => finishStop(id, ctrl, result.resumable),
    (error: unknown) => {
      if (error instanceof ApiError && error.status === 409) {
        finishStop(id, ctrl, false)
        return
      }
      halting.delete(id)
      if (before && isStopping(get(id).working)) dispatch(id, { type: 'status', verbs: before })
      showToast({ message: error instanceof ApiError && error.status === 403 ? CHAT_STOP_FORBIDDEN : CHAT_STOP_FAILED })
    },
  )
}

export const stop = (id: string) => {
  void hapticNotify('warning')
  reportCancel(id)
}

const mockFrom = new Map<string, { type: ChatItem['type']; nth: number | 'last' }>()

const olderCursor = new Map<string, string | null>()
const MOCK_OLDER_CURSOR = '1000'

export const hasOlder = (id: string) => !!olderCursor.get(id) || mockFrom.has(id)

const loadingOlder = new Map<string, Promise<void>>()

export const loadOlder = (id: string) => {
  const cursor = olderCursor.get(id)
  if (!cursor) return Promise.resolve()
  const running = loadingOlder.get(id)
  if (running) return running
  const job = (async () => {
    const page = await botApi.bots.transcript(id, { cursor })
    if (olderCursor.get(id) !== cursor) return
    olderCursor.set(id, page.page.nextCursor)
    const older = restoreBotTurns(page.data).items
    useChatStore.setState((s) => {
      const current = s.chats[id] ?? emptyChat
      return { chats: { ...s.chats, [id]: { ...current, items: prependOlder(current.items, older) } } }
    })
  })().finally(() => loadingOlder.delete(id))
  loadingOlder.set(id, job)
  return job
}

let chatEpoch = 0

const busy = (id: string) => runs.has(id) || !!get(id).working || get(id).items.length > 0

export const openBot = async (address: string) => {
  const epoch = chatEpoch
  const id = address === 'push' ? (await botApi.bots.get(address)).id : address
  if (epoch !== chatEpoch || busy(id)) return id
  const page = await botApi.bots.transcript(id)
  if (epoch !== chatEpoch || busy(id)) return id
  olderCursor.set(id, page.page.nextCursor)
  useChatStore.setState((s) => ({ chats: { ...s.chats, [id]: restoreBotTurns(page.data, page.live) } }))
  if (page.live && !API_MOCK) void startRun({ conversationId: id, follow: true, after: page.live.lastSeq, piece: openPieceId(page.data, page.live) })
  return id
}

export const shownItems = (id: string, items: ChatItem[]) => {
  const from = mockFrom.get(id)
  return from ? fromFirst(items, from.type, from.nth) : items
}

export const showFrom = (id: string, type: ChatItem['type'], nth: number | 'last' = 1) => {
  olderCursor.set(id, MOCK_OLDER_CURSOR)
  mockFrom.set(id, { type, nth })
  useChatStore.setState((s) => {
    const current = s.chats[id] ?? emptyChat
    return { chats: { ...s.chats, [id]: { ...current, items: fromFirst(current.items, type, nth) } } }
  })
}

export const forget = (id: string) => {
  olderCursor.delete(id)
  mockFrom.delete(id)
  useChatStore.setState((s) => {
    const { [id]: _, ...rest } = s.chats
    return { chats: rest }
  })
}

export const dropRun = (id: string) => {
  tokenBatch.flushNow(id)
  runs.get(id)?.abort()
  runs.delete(id)
  heldQueues.delete(id)
  pendingConsent.delete(id)
}

export const clearPushChat = async (id: string, kind: 'push' | 'company') => {
  if (kind !== 'push') return false
  await botApi.bots.clearChat(id)
  olderCursor.delete(id)
  dropRun(id)
  useChatStore.setState((s) => ({ chats: { ...s.chats, [id]: emptyChat } }))
  clearDraft(id)
  return true
}

export const deleteCompanyBot = async (id: string, kind: 'push' | 'company') => {
  if (kind !== 'company') return false
  await botApi.bots.remove(id)
  dropRun(id)
  forget(id)
  clearDraft(id)
  void queryClient.invalidateQueries({ queryKey: ['bots'] })
  return true
}

export const resetChat = () => {
  chatEpoch += 1
  for (const id of new Set([...runs.keys(), ...Object.keys(useChatStore.getState().chats)])) tokenBatch.flushNow(id)
  for (const ctrl of runs.values()) ctrl.abort()
  runs.clear()
  heldQueues.clear()
  halting.clear()
  olderCursor.clear()
  loadingOlder.clear()
  mockFrom.clear()
  openGate = null
  holdStop = false
  useChatStore.setState({ chats: {} })
  resetDrafts()
  resetConsent()
}

onSessionCleared(resetChat)

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

export const useReviewPage = create<{ request: ReviewPageRequest | null }>(() => ({ request: null }))
