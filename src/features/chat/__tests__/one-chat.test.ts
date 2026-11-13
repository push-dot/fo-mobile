import { ApiError, type BotContract } from '@push/api-client'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { applyEvent, emptyChat } from '../utils/reducer'
import { fromStream } from '../utils/stream'
import { THREAD_MOUNT_CAP } from '../constants'

const upload = vi.hoisted(() => vi.fn())
const botApi = vi.hoisted(() => ({
  bots: {
    get: vi.fn(),
    transcript: vi.fn(),
    send: vi.fn(),
    follow: vi.fn(),
    cancel: vi.fn(),
    answer: vi.fn(),
  },
}))
const api = vi.hoisted(() => ({
  conversations: { cancel: vi.fn(), stream: vi.fn(), follow: vi.fn(), resolveApproval: vi.fn(), messages: vi.fn(), turns: vi.fn() },
  me: { updateSettings: vi.fn() },
}))
vi.mock('@/shared/infrastructure', () => ({ api, botApi, http: {}, API_MOCK: false, hapticImpactLight: vi.fn(), hapticNotify: vi.fn() }))
vi.mock('@/features/my/api/fetchers', () => ({ myApi: { upload, sources: vi.fn(), googleConnected: vi.fn() } }))
vi.mock('../api/fetchers', () => ({
  chatApi: { run: vi.fn() },
  fetchConversationMessages: vi.fn(),
  fetchConversationTurns: vi.fn(),
  followConversation: vi.fn(),
  resolveConversationApproval: vi.fn(),
  streamConversation: vi.fn(),
  updateAiAccessMode: (mode: unknown) => api.me.updateSettings({ aiAccessMode: mode }),
}))
vi.mock('@/shared/components/toast-store', () => ({ showToast: vi.fn() }))

const { grantConsent, openBot, send, stop, useChatStore } = await import('../stores')
const { restoreBotTurns } = await import('../utils/turns')

const chat = (id: string) => useChatStore.getState().chats[id]!
const file = { uri: 'file:///a.pdf', name: 'a.pdf', mimeType: 'application/pdf', size: 4 }
const at = '2026-11-13T00:00:00.000Z'

const turn = (id: string, events: BotContract.TurnEvent[], user = '질문'): BotContract.Turn => ({
  id,
  status: 'DONE',
  createdAt: at,
  user: { messageId: `u-${id}`, text: user, attachments: [] },
  answer: null,
  events,
  assistant: null,
})

const token = (text: string, seq: number): BotContract.TurnEvent => ({ type: 'token', text, seq, at })
const status = (seq: number): BotContract.TurnEvent => ({ type: 'status', text: '생각 중', phase: 'thinking', since: at, seq, at })

const live = (turnId: string, seq: number, text: string, type: 'token' | 'done' | 'status' = 'token') =>
  type === 'done'
    ? { type: 'done' as const, operation: null, seq, at, turn: turnId }
    : type === 'status'
      ? { type: 'status' as const, text, phase: 'thinking' as const, since: at, seq, at, turn: turnId }
      : { type: 'token' as const, text, seq, at, turn: turnId }

const texts = (id: string) => chat(id).items.filter((item) => item.type === 'agentText').map((item) => item.text)

type Wire = {
  type: string
  seq?: number
  at?: string
  turn?: string
  text?: string
  operation?: null
  phase?: string
  since?: string
  name?: string
  state?: string
  summary?: string
}

async function* frames(...items: Wire[]) {
  yield* items
}

const collect = async <T>(g: AsyncIterable<T>) => {
  const out: T[] = []
  for await (const item of g) out.push(item)
  return out
}

beforeEach(() => {
  vi.clearAllMocks()
  useChatStore.setState({ chats: {} })
  upload.mockResolvedValue({ id: 'src-1' })
  botApi.bots.follow.mockReset()
  botApi.bots.send.mockReset()
  botApi.bots.follow.mockImplementation(() => frames())
  botApi.bots.get.mockResolvedValue({ id: 'b-push' })
})

describe('one chat per bot', () => {
  it('stores a chat under the id the server returns for push', async () => {
    botApi.bots.transcript.mockResolvedValue({
      data: [turn('t1', [token('이번 주', 1)], '이번 주에 마감되는 공고 알려 줘')],
      page: { nextCursor: null, hasMore: false },
      live: null,
    })
    const key = await openBot('push')
    expect(key).toBe('b-push')
    expect(useChatStore.getState().chats.push).toBeUndefined()
    expect(chat('b-push').items).toMatchObject([{ type: 'user', text: '이번 주에 마감되는 공고 알려 줘' }, { type: 'agentText', id: 't1:1', text: '이번 주' }])
  })

  it('opens the same bot twice without loading the transcript again', async () => {
    botApi.bots.transcript.mockResolvedValue({
      data: [turn('t1', [token('안녕', 1)])],
      page: { nextCursor: null, hasMore: false },
      live: null,
    })
    await openBot('push')
    await openBot('b-push')
    expect(botApi.bots.transcript).toHaveBeenCalledTimes(1)
    expect(texts('b-push')).toEqual(['안녕'])
  })

  it('reattaches after lastSeq and does not repeat text already on the page', async () => {
    botApi.bots.transcript.mockResolvedValue({
      data: [turn('t1', [token('안', 1), token('녕', 2)])],
      page: { nextCursor: null, hasMore: false },
      live: { turnId: 't1', lastSeq: 2 },
    })
    botApi.bots.follow.mockImplementation((_id: string, after?: number) =>
      after === 2 ? frames(live('t1', 3, '요'), live('t1', 4, '', 'done')) : frames(),
    )
    await openBot('b1')
    await vi.waitFor(() => expect(chat('b1').working).toBeNull())
    expect(botApi.bots.follow).toHaveBeenCalledWith('b1', 2, expect.anything())
    expect(texts('b1')).toEqual(['안녕요'])
    expect(chat('b1').items.some((item) => item.type === 'worked')).toBe(true)
  })

  it('uses the same entry id for a live piece and the reopened turn', async () => {
    const events = [token('안', 1), status(2), token('녕', 3), { type: 'tool' as const, name: 'read', state: 'ok' as const, summary: '읽기', seq: 4, at }, token('끝', 5)]
    const restored = restoreBotTurns([turn('t1', events)])
    const played = await collect(fromStream(frames(live('t1', 1, '안'), live('t1', 2, '생각 중', 'status'), live('t1', 3, '녕'), { type: 'tool', name: 'read', state: 'ok', summary: '읽기', seq: 4, at, turn: 't1' }, live('t1', 5, '끝'), live('t1', 6, '', 'done')), () => frames()))
    let liveState = emptyChat
    for (const event of played) liveState = applyEvent(liveState, event)
    const ids = (items: { type: string; id?: string }[]) => items.filter((item) => item.type === 'agentText').map((item) => item.id)
    expect(ids(restored.items)).toEqual(['t1:1', 't1:5'])
    expect(ids(liveState.items)).toEqual(['t1:1', 't1:5'])
  })

  it('sends a queued run with the intent and the uploaded attachment', async () => {
    let release!: () => void
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    botApi.bots.send.mockImplementation(async function* () {
      yield live('t', 1, '생각 중', 'status')
      await gate
      yield live('t', 2, '', 'done')
    })
    send('b-q', '먼저')
    await vi.waitFor(() => expect(chat('b-q').working).not.toBeNull())
    send('b-q', '이어서', file, 'fit')
    expect(chat('b-q').queue).toEqual([{ text: '이어서', file }])
    release()
    await vi.waitFor(() => expect(botApi.bots.send).toHaveBeenCalledTimes(2))
    expect(botApi.bots.send).toHaveBeenLastCalledWith(
      'b-q',
      expect.objectContaining({ text: '이어서', intent: 'fit', attachments: [{ kind: 'file', id: 'src-1' }] }),
      expect.anything(),
    )
  })

  it('releases the queue when reattach comes back empty and does not add a done row', async () => {
    botApi.bots.send.mockImplementation(async function* () {
      yield live('t1', 1, '안')
    })
    botApi.bots.follow.mockImplementation(async function* () {})
    send('b-204', '하나')
    send('b-204', '둘', undefined, 'calendar')
    await vi.waitFor(() => expect(botApi.bots.send).toHaveBeenCalledTimes(2))
    expect(chat('b-204').items.some((item) => item.type === 'worked')).toBe(false)
    expect(botApi.bots.send).toHaveBeenLastCalledWith('b-204', expect.objectContaining({ text: '둘', intent: 'calendar' }), expect.anything())
  })

  it('keeps the queue when the stream drops and does not read the drop as done', async () => {
    botApi.bots.send.mockImplementationOnce(async function* () {
      yield live('t1', 1, '안')
    })
    botApi.bots.follow.mockImplementation(async function* () {
      throw new Error('dropped')
    })
    send('b-drop', '하나')
    send('b-drop', '둘', undefined, 'fit')
    await vi.waitFor(() => expect(botApi.bots.follow).toHaveBeenCalledWith('b-drop', 1, expect.anything()))
    expect(botApi.bots.send).toHaveBeenCalledTimes(1)
    expect(chat('b-drop').working).not.toBeNull()
    expect(chat('b-drop').queue.map((item) => item.text)).toEqual(['둘'])
    expect(chat('b-drop').items.some((item) => item.type === 'worked')).toBe(false)
  })

  it('sends the held line before the one typed after a drop', async () => {
    botApi.bots.send.mockImplementationOnce(async function* () {
      yield live('t1', 1, '안')
    })
    botApi.bots.send.mockImplementation(async function* () {
      yield live('t2', 1, '생각 중', 'status')
      await new Promise(() => {})
    })
    let follows = 0
    botApi.bots.follow.mockImplementation(async function* (_id: string, after?: number) {
      follows += 1
      if (follows === 1) throw new Error('dropped')
      yield live('t1', (after ?? 0) + 1, '', 'done')
    })
    send('b-next', '하나')
    send('b-next', '둘', undefined, 'fit')
    send('b-next', '셋')
    await vi.waitFor(() => expect(botApi.bots.send).toHaveBeenCalledTimes(2))
    expect(botApi.bots.send).toHaveBeenLastCalledWith('b-next', expect.objectContaining({ text: '둘', intent: 'fit' }), expect.anything())
    expect(chat('b-next').queue.map((item) => item.text)).toEqual(['셋'])
  })

  it('sends the held line before the one typed after a stop', async () => {
    let release!: () => void
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    botApi.bots.send.mockImplementationOnce(async function* () {
      yield live('t', 1, '생각 중', 'status')
      await gate
      yield { type: 'cancelled', resumable: false, seq: 2, at, turn: 't' }
    })
    botApi.bots.send.mockImplementation(async function* () {
      yield live('t2', 1, '생각 중', 'status')
      await new Promise(() => {})
    })
    botApi.bots.cancel.mockResolvedValue({ status: 'CANCELLED', resumable: false })
    send('b-stop', '하나')
    await vi.waitFor(() => expect(chat('b-stop').working?.verbs).toEqual(['생각 중']))
    send('b-stop', '둘', undefined, 'fit')
    stop('b-stop')
    await vi.waitFor(() => expect(chat('b-stop').working).toBeNull())
    send('b-stop', '셋')
    expect(botApi.bots.send).toHaveBeenCalledTimes(1)
    expect(chat('b-stop').queue.map((item) => item.text)).toEqual(['둘', '셋'])
    release()
    await vi.waitFor(() => expect(botApi.bots.send).toHaveBeenCalledTimes(2))
    expect(botApi.bots.send).toHaveBeenLastCalledWith('b-stop', expect.objectContaining({ text: '둘', intent: 'fit' }), expect.anything())
    expect(chat('b-stop').queue.map((item) => item.text)).toEqual(['셋'])
  })

  it('does not abort the run that replaced the one being cancelled', async () => {
    let releaseA!: () => void
    const gateA = new Promise<void>((resolve) => {
      releaseA = resolve
    })
    let resolveCancel!: () => void
    botApi.bots.cancel.mockReturnValue(new Promise((resolve) => {
      resolveCancel = () => resolve({ status: 'CANCELLED' })
    }))
    const signals: AbortSignal[] = []
    botApi.bots.send
      .mockImplementationOnce(async function* (_id: string, _body: unknown, signal: AbortSignal) {
        signals.push(signal)
        yield live('t', 1, '생각 중', 'status')
        await gateA
        yield live('t', 2, '', 'done')
      })
      .mockImplementationOnce(async function* (_id: string, _body: unknown, signal: AbortSignal) {
        signals.push(signal)
        yield live('t2', 1, '생각 중', 'status')
        await new Promise(() => {})
      })
    send('b-cancel', '하나')
    await vi.waitFor(() => expect(signals).toHaveLength(1))
    stop('b-cancel')
    releaseA()
    await vi.waitFor(() => expect(chat('b-cancel').working).toBeNull())
    send('b-cancel', '둘')
    await vi.waitFor(() => expect(signals).toHaveLength(2))
    resolveCancel()
    await Promise.resolve()
    expect(signals[1]!.aborted).toBe(false)
    expect(chat('b-cancel').working).not.toBeNull()
  })

  it('resends each bot its own held run when consent is granted', async () => {
    botApi.bots.send.mockImplementation(() => {
      throw new ApiError('consent', 'CONSENT_REQUIRED', 403)
    })
    send('b-a', '하나', undefined, 'fit')
    send('b-b', '둘', undefined, 'calendar')
    await vi.waitFor(() => expect(botApi.bots.send).toHaveBeenCalledTimes(2))
    botApi.bots.send.mockImplementation(async function* () {
      yield live('t', 1, '', 'done')
    })
    grantConsent()
    await vi.waitFor(() => expect(botApi.bots.send).toHaveBeenCalledTimes(4))
    const bodies = botApi.bots.send.mock.calls.slice(2).map((call) => [call[0], (call[1] as { text: string }).text])
    expect(bodies).toEqual([
      ['b-a', '하나'],
      ['b-b', '둘'],
    ])
  })

  it('mounts fewer than 40 rows of a long thread', () => {
    expect(THREAD_MOUNT_CAP).toBeLessThan(40)
  })
})
