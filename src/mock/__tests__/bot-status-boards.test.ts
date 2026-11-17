import { beforeEach, describe, expect, it } from 'vitest'
import { createBotApi, createClient } from '@push/api-client'
import { GATED_STEP } from '../../features/chat/constants'
import { splitBotText } from '../../features/chat/utils/bot-text'
import { STATUS_STEPS } from '../../features/chat/utils/status-line'
import { pick } from '../bot-scripts/runs'
import { emptyBot, resetBots, seedThread } from '../bots'
import { grantReference } from '../chat'
import { mockFetch } from '../index'

const api = createBotApi(createClient({ baseUrl: 'http://x/api/v1', getToken: () => 't', fetch: mockFetch, uuid: () => 'k' }))

beforeEach(() => {
  resetBots()
  grantReference()
})

const frames = (token: string) => pick(token, false)!.steps.map((step) => step.frame)

describe('company-bot status board tokens', () => {
  it.each([
    ['st-think', '생각 중'],
    ['st-work', '공고 요건을 읽는 중'],
    ['st-queue', '순서를 기다리는 중 · 앞에 작업 1개'],
  ])('%s holds the status line %s until the tour stops it', (token, text) => {
    const [line, end] = pick(token, false)!.steps
    expect(line!.frame).toMatchObject({ type: 'status', text })
    expect(end!.wait).toBeGreaterThan(60_000)
  })

  it('st-steps plays the 13 working lines of ChatBotStatusSteps, each waiting for the step-next link, then ends', () => {
    const steps = pick('st-steps', false)!.steps
    expect(steps.slice(0, -1).map((step) => step.frame)).toEqual(STATUS_STEPS.map((text) => ({ type: 'status', text })))
    expect(steps.at(-1)!.frame).toMatchObject({ type: 'done' })
    expect(steps.slice(1).every((step) => step.wait === GATED_STEP)).toBe(true)
  })

  it('stops at a card that waits for an answer', () => {
    expect(frames('st-help').map((f) => f.type)).toEqual(['choice', 'done'])
    expect(frames('st-approve')[0]).toMatchObject({ type: 'approval', kind: 'TOOL_ACTION', title: '채용 페이지 열기', summary: 'careers.moapay.co.kr를 열어도 될까요?' })
  })

  it('answers the Android alias in its capitalized form', () => {
    expect(pick('St-think', false)!.steps[0]!.frame).toMatchObject({ text: '생각 중' })
  })
})

describe('bot:<id>:empty', () => {
  it('leaves a bot with no thread and nothing to ask', async () => {
    expect((await api.bots.transcript('b-moa')).data.length).toBeGreaterThan(0)
    emptyBot('b-moa')
    expect((await api.bots.transcript('b-moa')).data).toEqual([])
    expect((await api.bots.get('b-moa')).activity).toBeNull()
  })
})

describe('bot:<id>:resume', () => {
  it('stores the newest page of a longer thread, with the resume offer suggested', async () => {
    seedThread('b-moa', 'resume')
    const page = await api.bots.transcript('b-moa')
    expect(page.page.nextCursor).not.toBeNull()
    expect((await api.bots.transcript('b-moa', { cursor: page.page.nextCursor! })).data).toEqual([])
    const offer = page.data[0]!.events.find((e) => e.type === 'choice')
    expect(offer).toMatchObject({ options: [{ label: '이어서 작성하기' }, { label: '새로 시작하기' }], recommended: '0' })
    emptyBot('b-moa')
    expect((await api.bots.transcript('b-moa')).page.nextCursor).toBeNull()
  })
})

describe('bot:<id>:thread and :done', () => {
  const turns = async () => (await api.bots.transcript('b-moa')).data.reverse()

  it('stores the finished chat with its sources and no card to answer', async () => {
    seedThread('b-moa', 'thread')
    const all = await turns()
    expect(all.map((t) => t.user?.text ?? null)).toEqual([null, '좋아요. 첫 번째부터 고쳐 주세요'])
    expect(all.at(-1)!.assistant?.sources.map((s) => s.title)).toEqual(['모아페이 채용 공고', '김서준_백엔드_이력서'])
    expect((await api.bots.get('b-moa')).activity).toBeNull()
  })

  it('is the newest page of a longer thread, so the room draws no greeting above it (ChatBotHeader boards)', async () => {
    seedThread('b-moa', 'thread')
    expect((await api.bots.transcript('b-moa')).page.nextCursor).not.toBeNull()
    seedThread('b-moa', 'done')
    expect((await api.bots.transcript('b-moa')).page.nextCursor).toBeNull()
  })

  it('keeps only the one request of ChatBotStatusDone', async () => {
    seedThread('b-moa', 'done')
    const all = await turns()
    expect(all).toHaveLength(1)
    expect(all[0]!.user?.text).toBe('모아페이 공고에 맞춰 경력 섹션을 고쳐 주세요')
  })

  it('answers ChatBotStatusDone with the board text: a paragraph and two items', async () => {
    seedThread('b-moa', 'done')
    const text = (await turns())[0]!.assistant!.text
    expect(splitBotText(text).map((b) => (b.kind === 'paragraph' ? b.text.slice(0, 8) : b.kind === 'table' ? b.rows.length : b.kind === 'link' || b.kind === 'heading' || b.kind === 'sub' ? 0 : b.items.length))).toEqual(['경력 섹션 3줄', 2])
  })
})

describe('bot:<id>:sent (BotPickSent)', () => {
  it('stores one answer with a paragraph, a two-line list and the 출처 row', async () => {
    seedThread('b-moa', 'sent')
    const all = (await api.bots.transcript('b-moa')).data
    expect(all).toHaveLength(1)
    expect(all[0]!.user).toBeNull()
    expect(splitBotText(all[0]!.assistant!.text).map((b) => b.kind)).toEqual(['paragraph', 'list'])
    expect(all[0]!.assistant!.sources.map((s) => s.title)).toEqual(['모아페이 채용 공고', '김서준_백엔드_이력서'])
  })
})
