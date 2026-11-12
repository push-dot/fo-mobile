import { describe, expect, it } from 'vitest'
import type { BotLimit } from '../types'
import {
  asLink,
  chooseColor,
  clearPosting,
  closeSearch,
  failCreate,
  focusSearch,
  initialForm,
  limitCopy,
  linkFound,
  linkLabel,
  linkMissing,
  linkStatus,
  onPostingChosen,
  pickPosting,
  postingMeta,
  retryCreate,
  startLinkCheck,
  submitCreate,
  type PostingPick,
} from './create-form'

const posting: PostingPick = { postingId: 'p1', company: '모아페이', title: '백엔드 엔지니어' }
const limit: BotLimit = { plan: 'FREE', max: 3, used: 3, table: { FREE: 3, PRO: 20, ULTRA: null } }

describe('create form', () => {
  it('starts idle on the first colour', () => {
    expect(initialForm()).toEqual({ phase: { kind: 'idle' }, color: 'teal', consent: false })
  })

  it('searches, then checks a link, then keeps the found posting unpicked', () => {
    const searching = focusSearch(initialForm())
    expect(searching.phase).toEqual({ kind: 'searching', query: '' })
    const checking = startLinkCheck(searching, 'https://careers.moapay.co.kr/jobs/1042')
    expect(checking.phase).toMatchObject({ kind: 'linkChecking', url: 'https://careers.moapay.co.kr/jobs/1042' })
    expect(linkStatus()).toBe('Push에서 이 링크의 공고를 찾고 있어요')
    const found = linkFound(checking, { ...posting, host: 'careers.moapay.co.kr', meta: '마감 11월 20일 · 경력 3년 이상 · 서울' })
    expect(found.phase.kind).toBe('linkOk')
    expect(submitCreate(found).action).toBe('none')
  })

  it('marks a link that is not a posting', () => {
    const checking = startLinkCheck(focusSearch(initialForm()), 'https://moapay.co.kr/about')
    expect(linkMissing(checking).phase).toEqual({ kind: 'linkBad', url: 'https://moapay.co.kr/about' })
    expect(submitCreate(linkMissing(checking)).action).toBe('none')
  })

  it('opens the company bot that already exists and does not create', () => {
    expect(onPostingChosen({ id: 'b-moa' }, posting)).toEqual({ type: 'open', botId: 'b-moa' })
  })

  it('picks a posting only when that company has no bot', () => {
    expect(onPostingChosen(null, posting)).toEqual({ type: 'pick', posting })
    const picked = pickPosting(initialForm(), posting)
    expect(picked.phase).toEqual({ kind: 'picked', posting })
    expect(submitCreate(picked)).toEqual({ action: 'create', posting, color: 'teal' })
  })

  it('submits from no other phase', () => {
    const searching = focusSearch(initialForm())
    const checking = startLinkCheck(searching, 'https://moapay.co.kr/about')
    const bad = linkMissing(checking)
    const creating = { ...pickPosting(initialForm(), posting), phase: { kind: 'creating' as const, posting } }
    const limited = failCreate(pickPosting(initialForm(), posting), 'limit')
    expect(submitCreate(initialForm()).action).toBe('none')
    expect(submitCreate(searching).action).toBe('none')
    expect(submitCreate(checking).action).toBe('none')
    expect(submitCreate(bad).action).toBe('none')
    expect(submitCreate(creating).action).toBe('none')
    expect(submitCreate(limited).action).toBe('none')
    expect(limited.phase).toEqual({ kind: 'limit' })
  })

  it('keeps the posting on an error and submits it again', () => {
    const picked = pickPosting(chooseColor(initialForm(), 'pink'), posting)
    const failed = failCreate(picked, 'error')
    expect(failed.phase).toEqual({ kind: 'error', posting })
    expect(failed.color).toBe('pink')
    expect(retryCreate(failed)).toEqual({ action: 'create', posting, color: 'pink' })
    expect(retryCreate(picked).action).toBe('none')
  })

  it('asks for consent without dropping the posting', () => {
    const picked = pickPosting(initialForm(), posting)
    const next = failCreate(picked, 'consent')
    expect(next.consent).toBe(true)
    expect(next.phase).toEqual({ kind: 'picked', posting })
    expect(submitCreate(next).action).toBe('none')
  })

  it('clears a pick and closes search back to idle', () => {
    expect(clearPosting(pickPosting(initialForm(), posting)).phase.kind).toBe('idle')
    expect(closeSearch(focusSearch(initialForm())).phase.kind).toBe('idle')
  })

  it('reads the limit table from the server limit', () => {
    expect(limitCopy(limit)).toEqual({
      title: '봇을 3개까지 만들 수 있어요',
      body: '지금은 FREE 플랜이라 봇 3개를 모두 쓰고 있어요. 플랜을 올리거나 쓰지 않는 봇을 정리하면 새로 만들 수 있어요.',
      rows: [
        { plan: 'FREE', value: '3개', current: true },
        { plan: 'PRO', value: '20개', current: false },
        { plan: 'ULTRA', value: '무제한', current: false },
      ],
      note: 'Push Bot은 개수에 들어가지 않아요.',
    })
  })

  it('says 무제한 when the plan has no cap', () => {
    const ultra = limitCopy({ plan: 'ULTRA', max: null, used: 4, table: { FREE: 3, PRO: 20, ULTRA: null } })
    expect(ultra.title).toBe('봇을 무제한으로 만들 수 있어요')
    expect(ultra.rows[2]).toEqual({ plan: 'ULTRA', value: '무제한', current: true })
  })
})

describe('posting lines', () => {
  const day = new Date(2026, 10, 20)

  it('formats a search row and a found link', () => {
    expect(postingMeta({ deadline: day, careerMin: 3, careerMax: null })).toBe('마감 11월 20일 · 경력 3년 이상')
    expect(postingMeta({ deadline: null, careerMin: 0, careerMax: null })).toBe('상시 채용 · 신입 가능')
    expect(postingMeta({ deadline: day, careerMin: 3, careerMax: null, location: '서울' }, { location: true })).toBe('마감 11월 20일 · 경력 3년 이상 · 서울')
    expect(postingMeta({ deadline: day, careerMin: 4, careerMax: 6 })).toBe('마감 11월 20일 · 경력 4–6년')
  })

  it('treats a host path as a link and leaves a company name alone', () => {
    expect(asLink('모아')).toBeNull()
    expect(asLink('하늘커머스')).toBeNull()
    expect(asLink('careers.moapay.co.kr/jobs/1042')).toBe('https://careers.moapay.co.kr/jobs/1042')
    expect(asLink('https://moapay.co.kr/about')).toBe('https://moapay.co.kr/about')
    expect(linkLabel('https://careers.moapay.co.kr/jobs/1042')).toBe('careers.moapay.co.kr/jobs/1042')
  })
})
