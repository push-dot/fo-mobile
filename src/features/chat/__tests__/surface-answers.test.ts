import { ApiError, type A2uiFrame, type StreamEvent } from '@push/api-client'
import approvalTool from '@push/api-client/a2ui-fixtures/approval-tool.json'
import choiceMultiple from '@push/api-client/a2ui-fixtures/choice-multiple.json'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const botApi = vi.hoisted(() => ({
  bots: { cancel: vi.fn(), send: vi.fn(), follow: vi.fn(), get: vi.fn(), transcript: vi.fn(), answer: vi.fn() },
}))
vi.mock('@/shared/infrastructure', () => ({ api: {}, botApi, http: {}, API_MOCK: false, hapticImpactLight: vi.fn(), hapticNotify: vi.fn() }))
vi.mock('@/features/my/api/fetchers', () => ({ myApi: { sources: vi.fn(), googleConnected: vi.fn() } }))
vi.mock('../api/fetchers', () => ({ chatApi: {} }))

const { answerSurface, send, useChatStore } = await import('../stores')
const { applyEvent, emptyChat } = await import('../utils/reducer')
const { mapEvent } = await import('../utils/stream')
const { dataModel } = await import('../utils/surface')

async function* frames(...evs: StreamEvent[]) {
  yield* evs
}
const chat = (id: string) => useChatStore.getState().chats[id]!
const settled = (id: string) => vi.waitFor(() => expect(chat(id).working).toBeNull())
const model = (id: string, surfaceId: string) => {
  const row = chat(id).items.find((i) => i.type === 'surface' && i.id === surfaceId)
  return row?.type === 'surface' ? dataModel(row) : undefined
}

/** A chat paused on one gate fixture, as the stream leaves it. */
const waitingOn = (id: string, fixture: unknown, from = emptyChat) => {
  const f = fixture as A2uiFrame & StreamEvent
  const events = [...mapEvent(f), { type: 'wait' as const, surfaceId: f.surfaceId }, { type: 'done' as const, at: 0, awaiting: f.kind as 'approval' | 'choice' }]
  useChatStore.setState({ chats: { [id]: events.reduce(applyEvent, from) } })
  return f.surfaceId
}

beforeEach(() => {
  vi.clearAllMocks()
  botApi.bots.send.mockImplementation(() => frames({ type: 'token', text: '네' }, { type: 'done', operation: null }))
  botApi.bots.follow.mockImplementation(() => frames({ type: 'token', text: '실행했어요' }, { type: 'done', operation: null }))
  botApi.bots.answer.mockResolvedValue({ resumed: true, answer: { id: 'x', status: 'APPROVED', optionId: 'approve' } })
})

describe('answering a surface', () => {
  it('posts the pick to the approvals route, closes the surface in place, then follows the resumed run', async () => {
    const card = waitingOn('c1', approvalTool)
    answerSurface('c1', card, { optionId: 'approve' })
    expect(model('c1', card)).toMatchObject({ open: false, picked: ['approve'] })
    await settled('c1')
    expect(botApi.bots.answer).toHaveBeenCalledWith('c1', card, { optionId: 'approve' })
    expect(botApi.bots.follow).toHaveBeenCalled()
    expect(chat('c1').waiting).toBeNull()
    expect(chat('c1').items.some((i) => i.type === 'user')).toBe(false)
  })

  it('sends every id of a multiple pick and keeps them all picked', async () => {
    const card = waitingOn('c2', choiceMultiple)
    answerSurface('c2', card, { optionId: 'resume', optionIds: ['resume', 'cover_letter'] })
    await settled('c2')
    expect(botApi.bots.answer).toHaveBeenCalledWith('c2', card, { optionId: 'resume', optionIds: ['resume', 'cover_letter'] })
    expect(model('c2', card)).toMatchObject({ picked: ['resume', 'cover_letter'] })
  })

  it('ignores an answer to a surface the run does not wait on: no request, and the surface stays as it was', async () => {
    const older = JSON.parse(JSON.stringify(approvalTool).replaceAll(`"${approvalTool.surfaceId}"`, '"older"')) as A2uiFrame & StreamEvent
    useChatStore.setState({ chats: { c3: mapEvent(older).reduce(applyEvent, emptyChat) } })
    const card = waitingOn('c3', choiceMultiple, chat('c3'))
    const before = model('c3', 'older')
    answerSurface('c3', 'older', { optionId: 'approve' })
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(botApi.bots.answer).not.toHaveBeenCalled()
    expect(botApi.bots.follow).not.toHaveBeenCalled()
    expect(model('c3', 'older')).toEqual(before)
    expect(model('c3', 'older')).toMatchObject({ open: true })
    expect(chat('c3').waiting).toBe(card)
  })

  it('opens the surface again when the answer does not land', async () => {
    botApi.bots.answer.mockRejectedValue(new ApiError('gone', 'APPROVAL_ALREADY_RESOLVED', 409))
    const card = waitingOn('c4', approvalTool)
    answerSurface('c4', card, { optionId: 'reject' })
    await settled('c4')
    expect(chat('c4').waiting).toBe(card)
    expect(model('c4', card)).toMatchObject({ open: true, picked: [] })
    expect(chat('c4').items.at(-1)).toMatchObject({ type: 'error' })
  })

  it('sends text typed while a surface waits as a normal message, and closes the surface with nothing picked', async () => {
    const card = waitingOn('c5', approvalTool)
    send('c5', '잠깐, 다른 단계로 바꿔 줘')
    await settled('c5')
    expect(botApi.bots.send).toHaveBeenCalledWith('c5', expect.objectContaining({ text: '잠깐, 다른 단계로 바꿔 줘' }), expect.anything())
    expect(botApi.bots.answer).not.toHaveBeenCalled()
    expect(model('c5', card)).toMatchObject({ open: false, picked: [] })
    expect(chat('c5').items.some((i) => i.type === 'user' && i.text === '잠깐, 다른 단계로 바꿔 줘')).toBe(true)
  })
})
