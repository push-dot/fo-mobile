import { describe, expect, it } from 'vitest'
import type { BotId, BotRef } from '@/features/bots'
import type { Material, MaterialsPage } from '../types'
import { deleteCopy, detailFacts, detailTitle, listView, searchEmptyTitle, sendContextOf } from '../utils/material-view'

// The boards are drawn on 2026-11-09.
const now = new Date(2026, 10, 9, 15, 0)
const at = (m: number, d: number, h = 15, min = 0) => new Date(2026, m - 1, d, h, min)
const moapay: BotRef = { id: 'b1' as BotId, kind: 'company', name: '모아페이', color: 'teal' }
const dotori: BotRef = { id: 'b2' as BotId, kind: 'company', name: '도토리증권', color: 'amber' }
const pushBot: BotRef = { id: 'b0' as BotId, kind: 'push', name: 'Push Bot', color: null }

const resume: Material = {
  kind: 'file', id: 'f1', title: '김서준_백엔드_이력서.pdf', mimeType: 'application/pdf', bytes: 312_000, pages: 2, madeBy: { by: 'bot', bot: moapay }, updatedAt: at(11, 2, 15, 14),
}
const moaPosting: Material = {
  kind: 'posting', id: 'p1', title: '백엔드 엔지니어', company: '모아페이', deadline: new Date(2026, 10, 20), closed: false, careerMin: 3, careerMax: null, employmentType: 'full_time', location: '서울 강남구', bookmarkedAt: at(11, 1),
}
const github: Material = {
  kind: 'link', id: 'l1', title: '김서준 GitHub', url: 'https://github.com/seojun-kim', linkKind: 'github', addedAt: at(10, 3), lastCheck: { at: at(11, 8, 9), ok: true },
}

const page = (items: Partial<Record<'doc' | 'bookmark' | 'link', Material[]>>, counts = { doc: 8, bookmark: 6, link: 10 }): MaterialsPage => ({
  counts,
  sections: (['doc', 'bookmark', 'link'] as const).map((section) => ({ section, items: items[section] ?? [], hasMore: false })),
})

describe('listView', () => {
  it('shows the skeleton until the first answer, and the error board when that answer failed', () => {
    expect(listView({ data: undefined, isError: false }, 'all', '')).toEqual({ state: 'loading' })
    expect(listView({ data: undefined, isError: true }, 'all', '')).toEqual({ state: 'error' })
  })

  it('titles each section with its count and skips a section with no rows (Materials)', () => {
    const view = listView({ data: page({ doc: [resume], link: [github] }), isError: false }, 'all', '')
    expect(view.state === 'list' && view.rows.map((r) => (r.type === 'section' ? `${r.section} ${r.count}` : r.key))).toEqual(['doc 8', 'file:f1', 'link 10', 'link:l1'])
  })

  it.each(['all', 'doc', 'bookmark', 'link'] as const)('draws the empty board of the %s tab when it has nothing', (tab) => {
    expect(listView({ data: page({}, { doc: 0, bookmark: 0, link: 0 }), isError: false }, tab, '')).toEqual({ state: 'empty', empty: tab })
  })

  it('says the search found nothing, not that there is nothing, while a word is typed (MaterialsSearchEmpty)', () => {
    expect(listView({ data: page({}), isError: false }, 'doc', '회고 발표')).toEqual({ state: 'empty', empty: 'search' })
    expect(listView({ data: page({}), isError: false }, 'doc', '   ')).toEqual({ state: 'empty', empty: 'doc' })
  })
})

describe('copy that names a word', () => {
  it.each([
    ['회고 발표', '‘회고 발표’와 맞는 자료가 없어요'],
    ['이력서', '‘이력서’와 맞는 자료가 없어요'],
    ['경력', '‘경력’과 맞는 자료가 없어요'],
  ])('search empty for %s', (q, title) => {
    expect(searchEmptyTitle(q)).toBe(title)
  })

  it('asks before a delete in the words of MaterialDetailDelete, and toasts as DeleteDoc', () => {
    expect(deleteCopy(resume)).toEqual({
      title: '‘김서준_백엔드_이력서.pdf’를 삭제할까요?',
      body: '삭제하면 어느 봇에서도 이 서류를 쓸 수 없어요. 지운 서류는 30일 동안 보관된 뒤 완전히 지워지고, 이미 나눈 대화 내용은 그대로 남아요.',
      done: '서류를 삭제했어요',
      failed: '서류를 삭제하지 못했어요',
    })
  })

  it('names a bookmark and a link by what they are', () => {
    expect(deleteCopy(moaPosting)).toMatchObject({ title: '‘모아페이 · 백엔드 엔지니어’를 삭제할까요?', done: '북마크를 삭제했어요' })
    expect(deleteCopy({ ...github, title: '포트폴리오 사이트 링크' })).toMatchObject({ title: '‘포트폴리오 사이트 링크’를 삭제할까요?', done: '링크를 삭제했어요' })
    expect(deleteCopy({ ...github, title: '깃허브 저장소' }).title).toBe('‘깃허브 저장소’를 삭제할까요?')
    expect(deleteCopy({ ...github, title: '블로그 글' }).title).toBe('‘블로그 글’을 삭제할까요?')
  })
})

describe('detail sheet', () => {
  it('prints MaterialDetailDoc', () => {
    expect(detailTitle(resume)).toBe('김서준_백엔드_이력서.pdf')
    expect(detailFacts(resume, [moapay, dotori], now)).toEqual([
      { label: '종류', value: 'PDF · 2쪽 · 312KB' },
      { label: '만든 곳', value: '모아페이 봇' },
      { label: '수정', value: '11월 2일 오후 3:14' },
      { label: '쓰인 대화', value: '모아페이 봇, 도토리증권 봇' },
    ])
  })

  it('prints MaterialDetailBookmark', () => {
    expect(detailTitle(moaPosting)).toBe('모아페이 · 백엔드 엔지니어')
    expect(detailFacts(moaPosting, [moapay], now)).toEqual([
      { label: '마감', value: '11월 20일 (D-11)' },
      { label: '경력', value: '3년 이상 · 정규직' },
      { label: '위치', value: '서울 강남구' },
      { label: '북마크', value: '11월 1일' },
    ])
  })

  it('prints MaterialDetailLink', () => {
    expect(detailTitle(github)).toBe('김서준 GitHub')
    expect(detailFacts(github, [moapay], now)).toEqual([
      { label: '주소', value: 'https://github.com/seojun-kim' },
      { label: '종류', value: 'GitHub' },
      { label: '추가', value: '10월 3일' },
      { label: '마지막 확인', value: '어제 · 열림' },
    ])
  })

  it('hides 만든 곳, 쓰인 대화, and 마지막 확인 when the server does not have the fact', () => {
    const gone = detailFacts({ ...resume, madeBy: { by: 'bot', bot: null }, pages: null }, [], now)
    expect(gone.map((f) => f.label)).toEqual(['종류', '수정'])
    expect(gone[0]?.value).toBe('PDF · 312KB')
    expect(detailFacts({ ...github, lastCheck: null }, [], now).map((f) => f.label)).toEqual(['주소', '종류', '추가'])
    expect(detailFacts({ ...moaPosting, careerMin: null, employmentType: null, location: null }, [], now).map((f) => f.label)).toEqual(['마감', '북마크'])
  })

  it('names who made a 서류, and reads a Push document as one', () => {
    const doc: Material = { kind: 'document', id: 'd1', title: '기본 이력서', docKind: 'RESUME', madeBy: { by: 'bot', bot: pushBot }, updatedAt: at(10, 16, 9, 5) }
    expect(detailFacts(doc, [pushBot], now)).toEqual([
      { label: '종류', value: 'Push 서류' },
      { label: '만든 곳', value: 'Push Bot' },
      { label: '수정', value: '10월 16일 오전 9:05' },
      { label: '쓰인 대화', value: 'Push Bot' },
    ])
    expect(detailFacts({ ...resume, madeBy: { by: 'user' } }, [], now)[1]).toEqual({ label: '만든 곳', value: '직접 올림' })
  })

  it('reads a deadline that has passed, a closed posting, and 상시 채용', () => {
    const facts = (m: Partial<Extract<Material, { kind: 'posting' }>>) => detailFacts({ ...moaPosting, ...m } as Material, [], now)[0]?.value
    expect(facts({ deadline: new Date(2026, 10, 1) })).toBe('11월 1일 (마감)')
    expect(facts({ closed: true })).toBe('11월 20일 (마감)')
    expect(facts({ deadline: null })).toBe('상시 채용')
    expect(facts({ careerMin: 0, careerMax: null })).toBe('11월 20일 (D-11)')
    expect(detailFacts({ ...moaPosting, careerMin: 0, employmentType: 'intern' }, [], now)[1]?.value).toBe('신입 · 인턴')
  })
})

describe('sendContextOf', () => {
  it('attaches to the bot whose profile opened the modal, and asks for a bot from the bot home', () => {
    expect(sendContextOf('b1')).toEqual({ from: 'bot', botId: 'b1' })
    expect(sendContextOf(undefined)).toEqual({ from: 'home' })
  })
})
