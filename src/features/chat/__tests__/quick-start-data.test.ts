import type { Application, Offer, Posting } from '@push/api-client'
import { describe, expect, it, vi } from 'vitest'
import { quickStartFrom } from '../quick-start-data'

vi.mock('@/features/my', async () => {
  const utils = await import('../../my/utils')
  return { dday: utils.dday, givenName: utils.givenName, stageTone: utils.stageTone, timeAgo: utils.timeAgo, tintOf: utils.tintOf }
})

const now = new Date('2026-10-21T09:00:00')
const posting = (id: string, deadline: string | null) => ({ id, company: '모아페이', title: '백엔드', location: '서울', deadline }) as Posting

describe('quickStartFrom (real mode)', () => {
  it('lists bookmarks for 갭/적합도 and only the next 7 days for 마감 임박', () => {
    const bookmarks = [posting('a', '2026-10-30'), posting('b', '2026-10-23'), posting('c', '2026-10-20'), posting('d', null)]
    const fit = quickStartFrom('fit', { bookmarks, doc: '이력서.pdf' }, now)
    expect(fit.doc).toBe('이력서.pdf')
    expect(fit.items.map((i) => [i.id, i.over, !!i.selected])).toEqual([['a', '모아페이', true], ['b', '모아페이', false], ['c', '모아페이', false], ['d', '모아페이', false]])
    expect(quickStartFrom('deadline', { bookmarks }, now).items.map((i) => [i.id, i.badge])).toEqual([['b', { label: 'D-2', tone: 'red' }]])
  })

  it('maps applications and pending offers', () => {
    const apps = [{ id: 'x', company: '도토리', title: '서버', stage: 'INTERVIEW' }, { id: 'y', company: '라온', title: '앱', stage: 'REJECTED' }] as Application[]
    expect(quickStartFrom('status', { applications: apps }, now).items.map((i) => [i.badge?.label, !!i.selected])).toEqual([['면접', true], ['불합격', false]])
    const offer = (status: Offer['status']) =>
      ({ id: status, status, sender: { id: 's', displayName: '오지현' }, message: '커피챗 어떠세요?', posting: null, createdAt: '2026-10-21T08:00:00' }) as unknown as Offer
    const reply = quickStartFrom('reply', { offers: [offer('SENT'), offer('ACCEPTED')] }, now)
    expect(reply.items).toMatchObject([{ id: 'SENT', title: '오지현', body: '커피챗 어떠세요?', badge: { label: '새 제안' } }])
  })

  it('leaves AI-suggested sheets empty', () => {
    expect(quickStartFrom('exp', {}, now).items).toEqual([])
    expect(quickStartFrom('calendar', { connected: true }, now).calendar).toEqual({ connected: true })
  })
})
