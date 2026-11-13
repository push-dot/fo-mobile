import { ApiError, type StreamEvent } from '@push/api-client'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Approval } from '../types'

const botApi = vi.hoisted(() => ({ bots: { answer: vi.fn(), retryCard: vi.fn() } }))
const toast = vi.hoisted(() => vi.fn())
vi.mock('@/shared/infrastructure', () => ({ api: {}, botApi, http: {}, API_MOCK: false, hapticImpactLight: vi.fn(), hapticNotify: vi.fn() }))
vi.mock('@/shared/components/toast-store', () => ({ showToast: toast }))
vi.mock('@/features/my/api/fetchers', () => ({ myApi: {} }))
vi.mock('../api/fetchers', () => ({ chatApi: {}, updateAiAccessMode: vi.fn() }))

const { closeApproval, retryApproval, useChatStore } = await import('../stores')
const { applyEvent, emptyChat } = await import('../utils/reducer')
const { cardState, expiredNote, isSiteCard, lifetimeLabel, waitingLine } = await import('../utils/card')
const { mapEvent } = await import('../utils/stream')

const MIN = 60_000
const OPENED = Date.parse('2026-11-13T01:00:00Z')

const card = (over: Partial<Approval> = {}): Approval => ({
  id: 'card1',
  question: '모아페이 채용 페이지를 열어도 될까요?',
  sections: [],
  confirm: true,
  openedAt: OPENED,
  expiresAt: OPENED + 10 * MIN,
  optionIds: ['approve', 'approve_always', 'reject'],
  ...over,
})

describe('cardState', () => {
  it('flips to expired exactly at expiresAt', () => {
    const c = card()
    expect(cardState(c, OPENED + 10 * MIN - 1)).toBe('open')
    expect(cardState(c, OPENED + 10 * MIN)).toBe('expired')
  })

  it('never expires a card without expiresAt', () => {
    expect(cardState(card({ expiresAt: undefined }), OPENED + 99 * 60 * MIN)).toBe('open')
  })
})

describe('waitingLine', () => {
  it('shows while the card is open and leaves with its time', () => {
    expect(waitingLine(card(), cardState(card(), OPENED + MIN))).toMatchObject({ kind: 'waiting', for: 'confirm', text: '확인을 기다리고 있어요', cardId: 'card1' })
    expect(waitingLine(card(), cardState(card(), OPENED + 10 * MIN))).toBeNull()
    expect(waitingLine(null, 'open')).toBeNull()
  })

  it('counts the wait from the ask', () => {
    expect(waitingLine(card(), 'open')?.since.getTime()).toBe(OPENED)
  })
})

describe('expiredNote', () => {
  it('names the card lifetime, rounded and not floored', () => {
    // A live frame has no openedAt: the stamp comes a few ms after created_at, which floors 10 minutes to 9.
    expect(expiredNote({ openedAt: OPENED + 7, expiresAt: OPENED + 10 * MIN })).toBe('10분 동안 답이 없어서 작업을 멈췄어요. 다시 요청하면 이어서 해요.')
    expect(expiredNote({ openedAt: OPENED - 7, expiresAt: OPENED + 10 * MIN })).toContain('10분')
  })

  it('says 10분 again after a retry, which moves both times together', () => {
    const retried = applyEvent({ ...emptyChat, approval: card() }, { type: 'retried', openedAt: OPENED + 30 * MIN, expiresAt: OPENED + 40 * MIN })
    expect(expiredNote(retried.approval!)).toContain('10분 동안')
  })

  it('reads whole hours as 시간', () => {
    expect(lifetimeLabel(24 * 60 * MIN)).toBe('24시간')
    expect(lifetimeLabel(90 * MIN)).toBe('90분')
  })
})

describe('reducer', () => {
  it('retried replaces the card times and keeps the card', () => {
    const next = applyEvent({ ...emptyChat, approval: card() }, { type: 'retried', openedAt: OPENED + 30 * MIN, expiresAt: OPENED + 40 * MIN })
    expect(next.approval).toMatchObject({ id: 'card1', openedAt: OPENED + 30 * MIN, expiresAt: OPENED + 40 * MIN })
    expect(cardState(next.approval!, OPENED + 35 * MIN)).toBe('open')
  })

  it('dismiss drops the card with no answer bubble', () => {
    const next = applyEvent({ ...emptyChat, approval: card() }, { type: 'dismiss' })
    expect(next.approval).toBeNull()
    expect(next.items).toEqual([])
  })
})

describe('mapEvent of a page-read approval', () => {
  const frame = {
    type: 'approval',
    id: 'card1',
    kind: 'TOOL_ACTION',
    title: '모아페이 채용 페이지를 열어도 될까요?',
    summary: 'careers.moapay.co.kr · 공고 1개를 읽어요',
    foot: '10분 동안 답이 없으면 이 요청은 만료돼요',
    options: [
      { id: 'approve', label: '한 번 허용' },
      { id: 'approve_always', label: '항상 허용', desc: '이 봇이 이 사이트를 읽을 때 다시 묻지 않아요' },
      { id: 'reject', label: '거절' },
    ],
    expiresAt: '2026-11-13T01:10:00.007Z',
    seq: 2,
    turn: 't1',
    at: '2026-11-13T01:00:00.007Z',
  } as StreamEvent

  it('keeps the title as the question, the summary under it, and reads the ask from the stamp', () => {
    const [event] = mapEvent(frame)
    expect(event).toMatchObject({ type: 'approval' })
    const approval = (event as { approval: Approval }).approval
    expect(approval).toMatchObject({
      question: '모아페이 채용 페이지를 열어도 될까요?',
      detail: 'careers.moapay.co.kr · 공고 1개를 읽어요',
      foot: '10분 동안 답이 없으면 이 요청은 만료돼요',
      confirm: true,
      openedAt: Date.parse('2026-11-13T01:00:00.007Z'),
      expiresAt: Date.parse('2026-11-13T01:10:00.007Z'),
    })
    expect(approval.warning).toBeUndefined()
    expect(approval.sections[0]).toMatchObject({ kind: 'choices', selected: [] })
    expect(expiredNote(approval)).toContain('10분')
  })

  it('recognises the card by its 항상 허용 answer', () => {
    expect(isSiteCard(['approve', 'approve_always', 'reject'])).toBe(true)
    expect(isSiteCard(['approve', 'reject'])).toBe(false)
  })
})

describe('닫기 and 다시 요청', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useChatStore.setState({ chats: { b1: { ...emptyChat, approval: card() } } })
  })
  const approval = () => useChatStore.getState().chats.b1!.approval

  it('닫기 answers reject and drops the card', async () => {
    botApi.bots.answer.mockResolvedValue({ id: 'card1', status: 'REJECTED', optionId: 'reject' })
    await closeApproval('b1')
    expect(botApi.bots.answer).toHaveBeenCalledWith('b1', 'card1', { optionId: 'reject' })
    expect(approval()).toBeNull()
  })

  it('닫기 keeps the card when the request fails', async () => {
    botApi.bots.answer.mockRejectedValue(new ApiError('down', 'INTERNAL', 500))
    await closeApproval('b1')
    expect(approval()).not.toBeNull()
    expect(toast).toHaveBeenCalled()
  })

  it('다시 요청 replaces the times with the server answer', async () => {
    botApi.bots.retryCard.mockResolvedValue({ id: 'card1', status: 'PENDING', openedAt: '2026-11-13T02:00:00Z', expiresAt: '2026-11-13T02:10:00Z' })
    await retryApproval('b1')
    expect(approval()).toMatchObject({ openedAt: Date.parse('2026-11-13T02:00:00Z'), expiresAt: Date.parse('2026-11-13T02:10:00Z') })
  })

  it('a superseded retry drops the card', async () => {
    botApi.bots.retryCard.mockRejectedValue(new ApiError('newer', 'APPROVAL_SUPERSEDED', 409))
    await retryApproval('b1')
    expect(approval()).toBeNull()
  })
})

describe('mock page-read script', () => {
  it('asks with three answers and a ten minute life', async () => {
    const { pageReadCard, pageReadFrames } = await import('../../../mock/bot-scripts/cards')
    const now = new Date('2026-11-13T01:00:00Z')
    const c = pageReadCard('c9', 't9', '모아페이', 'careers.moapay.co.kr', now)
    const frames = pageReadFrames(c, 't9', now, 0)
    const approval = (mapEvent(frames[1]! as unknown as StreamEvent)[0] as { approval: Approval }).approval
    expect(approval.optionIds).toEqual(['approve', 'approve_always', 'reject'])
    expect(expiredNote(approval)).toContain('10분 동안')
    expect(frames.map((f) => f.type)).toEqual(['status', 'approval', 'done'])
  })
})
