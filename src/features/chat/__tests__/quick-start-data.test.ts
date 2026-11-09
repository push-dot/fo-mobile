import type { Application, Offer, Posting, Profile } from '@push/api-client'
import { brandColor } from '@push/shared'
import { registerMockBrandColors } from '@push/shared/mock-brand'
import { describe, expect, it, vi } from 'vitest'
import { docMeta, initialPicks, postingMeta, quickStartFrom } from '../utils/quick-start-data'

vi.mock('@/features/my', async () => {
  const utils = await import('../../my/utils')
  return { dday: utils.dday, givenName: utils.givenName, stageTone: utils.stageTone, timeAgo: utils.timeAgo }
})

const now = new Date('2026-10-21T09:00:00')
const posting = (id: string, deadline: string | null, career = { careerMin: 4, careerMax: 6 as number | null }) =>
  ({ id, company: '모아페이', title: '백엔드', location: '서울 강남구', deadline, ...career }) as Posting
const person = (userId: string) => ({ userId, displayName: '오지현', headline: '프론트엔드' }) as Profile

describe('quickStartFrom (real mode)', () => {
  it('lists bookmarks for 갭/적합도 and only the next 7 days for 마감 임박', () => {
    const bookmarks = [posting('a', '2026-10-30'), posting('b', '2026-10-23'), posting('c', '2026-10-20'), posting('d', null)]
    const fit = quickStartFrom('fit', { bookmarks, doc: '이력서.pdf' }, now)
    expect(fit.doc).toBe('이력서.pdf')
    // Same company colour as the job cards and the WebView, not the person-avatar tint.
    expect(fit.items[0]!.logo!.color).toBe(brandColor('모아페이'))
    expect(fit.items.map((i) => [i.id, i.over, !!i.selected])).toEqual([['a', '모아페이', true], ['b', '모아페이', false], ['c', '모아페이', false], ['d', '모아페이', false]])
    expect(quickStartFrom('deadline', { bookmarks }, now).items.map((i) => [i.id, i.badge])).toEqual([['b', { label: 'D-2', tone: 'red' }]])
  })

  it('maps applications and pending offers', () => {
    const apps = [{ id: 'x', company: '도토리', title: '서버', stage: 'INTERVIEW' }, { id: 'y', company: '라온', title: '앱', stage: 'REJECTED' }] as Application[]
    expect(quickStartFrom('status', { applications: apps }, now).items.filter((i) => i.seg === 1).map((i) => [i.badge?.label, !!i.selected])).toEqual([['면접', true], ['불합격', false]])
    const offer = (status: Offer['status']) =>
      ({ id: status, status, sender: { id: 's', displayName: '오지현' }, message: '커피챗 어떠세요?', posting: null, createdAt: '2026-10-21T08:00:00' }) as unknown as Offer
    const reply = quickStartFrom('reply', { offers: [offer('SENT'), offer('ACCEPTED')] }, now)
    expect(reply.items).toMatchObject([{ id: 'SENT', title: '오지현', body: '커피챗 어떠세요?', badge: { label: '새 제안' } }])
    // People take the board palette and overrides like company tiles (ProposalDetailMenu 지현 #E8590C).
    registerMockBrandColors()
    expect(quickStartFrom('reply', { offers: [offer('SENT')] }, now).items[0]!.avatar!.color).toBe('#E8590C')
  })

  it('leaves AI-suggested sheets empty', () => {
    expect(quickStartFrom('exp', {}, now).items).toEqual([])
    expect(quickStartFrom('calendar', { connected: true }, now).calendar).toEqual({ connected: true })
  })

  it('gap sub joins location and career', () => {
    const gap = quickStartFrom('gap', { bookmarks: [posting('a', null)], recent: [] }, now)
    expect(gap.items[0]!.sub).toBe('서울 강남구 · 4–6년')
    expect(gap.segments).toEqual(['북마크 1', '최근 본 공고'])
    expect(gap.empty).toEqual([undefined, '최근 본 공고가 없어요.'])
  })

  it('recent segment hidden without a source', () => {
    expect(quickStartFrom('fit', { bookmarks: [posting('a', null)] }, now).segments).toBeUndefined()
    expect(quickStartFrom('coffee', { follows: [person('u1')] }, now).segments).toBeUndefined()
    const coffee = quickStartFrom('coffee', { follows: [person('u1')], recommended: [person('u2')] }, now)
    expect(coffee.segments).toEqual(['팔로잉 1', '허브 추천'])
    expect(coffee.items.map((i) => [i.id, i.seg ?? 0])).toEqual([['u1', 0], ['u2', 1]])
  })

  it('status segments split active', () => {
    const apps = [{ id: 'x', company: '도토리', title: '서버', stage: 'INTERVIEW' }, { id: 'y', company: '라온', title: '앱', stage: 'REJECTED' }] as Application[]
    const status = quickStartFrom('status', { applications: apps }, now)
    expect(status.segments).toEqual(['진행 중 1', '전체 2'])
    expect(status.items.map((i) => [i.id, i.seg ?? 0])).toEqual([['x', 0], ['x', 1], ['y', 1]])
  })

  it('hub subs count careers and skills', () => {
    const profile = { careers: [{}, {}], skills: ['Kotlin', 'Spring', 'Kafka'] } as unknown as Profile
    const subs = (p?: Profile) => quickStartFrom('hub', { profile: p }, now).items.map((i) => i.sub)
    expect(subs(profile)).toEqual(['한 줄 소개', '3~4문장', '2건', '3개'])
    expect(subs(undefined)).toEqual(['한 줄 소개', '3~4문장', undefined, undefined])
  })

  it('deadline badge is red within 3 days and grey after', () => {
    const bookmarks = [posting('a', '2026-10-24'), posting('b', '2026-10-25')]
    expect(quickStartFrom('deadline', { bookmarks }, now).items.map((i) => i.badge)).toEqual([{ label: 'D-3', tone: 'red' }, { label: 'D-4', tone: 'grey' }])
  })

  it('status lists 합격 under 진행 중 but leaves it unchecked', () => {
    const apps = [{ id: 'x', company: '도토리', title: '서버', stage: 'OFFER' }, { id: 'y', company: '라온', title: '앱', stage: 'APPLIED' }] as Application[]
    const status = quickStartFrom('status', { applications: apps }, now)
    expect(status.items.filter((i) => !i.seg).map((i) => [i.id, !!i.selected])).toEqual([['x', false], ['y', true]])
  })

  it('single-pick cards open with the first suggestion chosen', () => {
    const items = [{ id: 'a', title: 'A' }, { id: 'b', title: 'B' }]
    expect(initialPicks({ layout: 'cards' }, items)).toEqual(['a'])
    expect(initialPicks({ layout: 'cards', multi: true }, items)).toEqual([])
    expect(initialPicks({ layout: 'pick' }, items)).toEqual([])
    expect(initialPicks({ layout: 'cards' }, [{ id: 'a', title: 'A' }, { id: 'b', title: 'B', selected: true }])).toEqual(['b'])
  })

  it('formats 자료 고르기 row meta', () => {
    expect(docMeta({ fileName: '이력서.pdf', size: 2_400_000, createdAt: '2026-10-12T09:00:00' })).toBe('PDF · 2.4MB · 10월 12일')
    expect(docMeta({ fileName: '경력.docx', size: 640_000, createdAt: '2026-09-28T09:00:00' })).toBe('DOCX · 640KB · 9월 28일')
    expect(postingMeta(posting('a', '2026-11-03'), new Date('2026-10-21T09:00:00'))).toBe('서울 강남구 · 경력 4–6년 · D-13')
    expect(postingMeta(posting('a', null, { careerMin: 0, careerMax: null }))).toBe('서울 강남구 · 신입')
  })
})
