import { describe, expect, it, vi } from 'vitest'
import type { BotContract } from '@push/api-client'
import type { BotId } from '@/features/bots'
import type { Material, MaterialsPage } from '../types'
import { toMaterial, toMaterialDetail, toMaterialsPage } from '../api/schemas'
import { hostOf, materialRow, toAttachment, totalCount, withoutMaterial } from '../utils/material-row'

// The bots index re-exports hooks that reach react-native, which vitest cannot load. Its wire readers are all the schemas use.
vi.mock('@/features/bots', () => import('@/features/bots/utils/wire'))

// The boards are drawn on 2026-11-09: 마감 11월 12일 is D-3 there.
const now = new Date(2026, 10, 9, 15, 0)
const day = (m: number, d: number) => new Date(2026, m - 1, d, 15)

const file = (madeBy: Extract<Material, { kind: 'file' }>['madeBy'], title = '김서준_백엔드_이력서.pdf'): Material => ({
  kind: 'file', id: 'f1', title, mimeType: 'application/pdf', bytes: 312_000, pages: 2, madeBy, updatedAt: day(11, 2),
})
const posting = (deadline: Date | null, company = '도토리증권', title = '서버 개발자'): Material => ({
  kind: 'posting', id: 'p1', title, company, deadline, closed: false, careerMin: 3, careerMax: null, employmentType: null, location: null, bookmarkedAt: day(10, 30),
})
const link = (url: string, linkKind: Extract<Material, { kind: 'link' }>['linkKind']): Material => ({
  kind: 'link', id: 'l1', title: '김서준 GitHub', url, linkKind, addedAt: day(10, 3), lastCheck: null,
})
const moapay = { id: 'b1' as BotId, kind: 'company' as const, name: '모아페이', color: 'teal' as const }

describe('materialRow', () => {
  it.each<[Material, string, string]>([
    [file({ by: 'bot', bot: moapay }), '김서준_백엔드_이력서.pdf', 'PDF · 11월 2일 · 모아페이 Bot이 만듦'],
    [file({ by: 'user' }), '김서준_백엔드_이력서.pdf', 'PDF · 11월 2일 · 직접 올림'],
    [file({ by: 'bot', bot: { id: 'push' as BotId, kind: 'push', name: 'Push Bot', color: null } }), '김서준_백엔드_이력서.pdf', 'PDF · 11월 2일 · Push Bot이 만듦'],
    [file({ by: 'bot', bot: null }), '김서준_백엔드_이력서.pdf', 'PDF · 11월 2일 · Bot이 만듦'],
    [posting(day(11, 12)), '도토리증권 · 서버 개발자', '공고 · 마감 11월 12일(D-3) · 북마크 10월 30일'],
    [posting(day(11, 20), '모아페이', '백엔드 엔지니어'), '모아페이 · 백엔드 엔지니어', '공고 · 마감 11월 20일 · 북마크 10월 30일'],
    [posting(null, '누리클라우드', '플랫폼 엔지니어'), '누리클라우드 · 플랫폼 엔지니어', '공고 · 상시 채용 · 북마크 10월 30일'],
    [link('https://github.com/seojun-kim', 'github'), 'github.com', '링크 · GitHub · 10월 3일 추가'],
    [link('https://seojun.dev/blog/payment-retry', 'blog'), 'seojun.dev', '링크 · 블로그 · 10월 3일 추가'],
    [link('https://linkedin.com/in/seojun-kim', 'linkedin'), 'linkedin.com', '링크 · LinkedIn · 10월 3일 추가'],
    [link('https://careers.nuricloud.co.kr/jobs/a?utm_source=push', 'job'), 'careers.nuricloud.co.kr', '링크 · 채용 페이지 · 10월 3일 추가'],
  ])('%#: %s', (m, title, sub) => {
    expect(materialRow(m, now)).toEqual({ title, sub })
  })

  it.each([
    ['https://www.google.com/search?q=x', 'google.com'],
    ['http://user:pw@seojun.dev:8080/a#b', 'seojun.dev'],
    ['github.com/seojun-kim', 'github.com'],
  ])('reads the host of %s', (url, host) => {
    expect(hostOf(url)).toBe(host)
  })

  it('keeps the row title on the attachment', () => {
    expect(toAttachment(posting(null))).toEqual({ kind: 'posting', id: 'p1', title: '도토리증권 · 서버 개발자' })
  })
})

describe('reading the wire', () => {
  it('reads who made a file', () => {
    const made = toMaterial({ kind: 'file', id: 'f1', title: 'a.pdf', mimeType: 'application/pdf', size: 1, pageCount: null, origin: 'AI', createdBy: null, updatedAt: '2026-11-02T06:14:00Z' })
    expect(made).toMatchObject({ madeBy: { by: 'bot', bot: null } })
  })

  const wireLink = (host: string, linkKind: Extract<BotContract.Material, { kind: 'link' }>['linkKind']): BotContract.MaterialDetail => ({
    kind: 'link', id: 'l1', title: 'in', url: `https://${host}/in/x`, host, linkKind, addedAt: '2026-09-02T00:00:00Z', lastCheckedAt: null, lastCheckOk: null,
    usedBy: [{ id: 'b1', kind: 'company', displayName: '모아페이', color: 'teal' }],
  })

  it('labels a link LinkedIn from its host, whatever kind it is stored with', () => {
    const detail = toMaterialDetail(wireLink('linkedin.com', 'other'))
    expect(detail.material).toMatchObject({ linkKind: 'linkedin', lastCheck: null })
    expect(materialRow(detail.material, now).sub).toBe('링크 · LinkedIn · 9월 2일 추가')
    expect(detail.material).not.toHaveProperty('usedBy')
    expect(detail.usedBy).toEqual([moapay])
    expect(toMaterialDetail(wireLink('kr.linkedin.com', 'portfolio')).material).toMatchObject({ linkKind: 'linkedin' })
  })

  it.each([['', 'other'], ['notlinkedin.com', 'blog'], ['linkedin.com.example.org', 'portfolio']] as const)('keeps the stored kind for host %j', (host, kind) => {
    expect(toMaterialDetail(wireLink(host, kind)).material).toMatchObject({ linkKind: kind })
  })

  const wireFile = (updatedAt: string, createdBy: BotContract.BotRef | null = null): BotContract.Material => ({
    kind: 'file', id: 'f1', title: 'a.pdf', mimeType: 'application/pdf', size: 1, pageCount: null, origin: createdBy ? 'AI' : 'UPLOAD', createdBy, updatedAt,
  })

  it('drops a row whose date does not parse, as the bot list does, and refuses it as a detail', () => {
    const page = toMaterialsPage({ counts: { doc: 2, bookmark: 0, link: 0 }, sections: [{ section: 'doc', items: [wireFile('not a date'), wireFile('2026-11-02T06:14:00Z')], nextCursor: null }] })
    expect(page.sections[0]?.items).toHaveLength(1)
    expect(() => toMaterialDetail({ ...wireFile('2026-13-45'), usedBy: [] })).toThrow('unreadable material')
    expect(toMaterial({ ...wireLink('github.com', 'github'), lastCheckedAt: 'yesterday' } as BotContract.Material)).toBeNull()
  })

  it('reads a bot reference the way the bot list does: a colour the app has no swatch for is gray, the Push Bot has none', () => {
    const odd = { id: 'b9', kind: 'company', displayName: '새회사', color: 'neon' } as unknown as BotContract.BotRef
    expect(toMaterial(wireFile('2026-11-02T06:14:00Z', odd))).toMatchObject({ madeBy: { by: 'bot', bot: { name: '새회사', color: 'gray' } } })
    expect(toMaterial(wireFile('2026-11-02T06:14:00Z', { id: 'b-push', kind: 'push', displayName: 'Push Bot', color: 'teal' }))).toMatchObject({ madeBy: { bot: { color: null } } })
  })
})

describe('withoutMaterial', () => {
  const page: MaterialsPage = {
    counts: { doc: 8, bookmark: 6, link: 10 },
    sections: [
      { section: 'doc', items: [file({ by: 'user' })], hasMore: false },
      { section: 'bookmark', items: [posting(null)], hasMore: false },
    ],
  }

  it('drops the row and counts its section one less', () => {
    const next = withoutMaterial(page, 'posting', 'p1')
    expect(next.sections[1]?.items).toEqual([])
    expect(next.counts).toEqual({ doc: 8, bookmark: 5, link: 10 })
    expect(totalCount(next.counts)).toBe(23)
  })

  it('changes nothing for a material the page does not hold', () => {
    expect(withoutMaterial(page, 'link', 'p1')).toBe(page)
  })
})
