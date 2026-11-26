import { describe, expect, it } from 'vitest'
import {
  careerPeriod,
  dayTitle,
  dday,
  followState,
  monthGrid,
  offerBadge,
  dateToYm,
  fromDayParam,
  parseYm,
  toDayParam,
  ymToDate,
  postedAt,
  timeAgo,
  toResumeDraft,
} from './index'

describe('my lib', () => {
  it('maps the push-be profile draft to the viewer draft', () => {
    const d = toResumeDraft({
      displayName: '김서준',
      headline: '백엔드 개발자',
      tenureYears: 4,
      intro: '소개',
      careers: [
        { company: '모아페이', title: '백엔드 엔지니어', start: '2022-03', end: '' },
        { company: '하루랩스', title: '서버 개발자', start: '2021-01', end: '2022-02' },
      ],
      skills: ['Kotlin'],
    })
    expect(d.pageCount).toBeNull()
    expect(d.profile.careers).toEqual([
      { company: '모아페이', role: '백엔드 엔지니어', startedOn: '2022-03', endedOn: null, description: '' },
      { company: '하루랩스', role: '서버 개발자', startedOn: '2021-01', endedOn: '2022-02', description: '' },
    ])
  })

  it('derives follow state only from what me/follows proves', () => {
    const page = (ids: string[], hasMore: boolean) => ({
      data: ids.map((userId) => ({ userId }) as never),
      page: { nextCursor: null, hasMore },
    })
    expect(followState(undefined, 'a')).toBeUndefined()
    expect(followState(page(['a'], true), 'a')).toBe(true)
    expect(followState(page(['a'], false), 'b')).toBe(false)
    expect(followState(page(['a'], true), 'b')).toBeUndefined()
  })

  it('formats career periods', () => {
    expect(careerPeriod({ startedOn: '2022-03', endedOn: null })).toBe('2022년 3월 – 현재')
    expect(careerPeriod({ startedOn: '2021-01', endedOn: '2022-02' })).toBe(
      '2021년 1월 – 2022년 2월',
    )
  })

  it('parses year-month input', () => {
    expect(parseYm('2022.3')).toBe('2022-03')
    expect(parseYm('2022-11')).toBe('2022-11')
    expect(parseYm('2022.13')).toBeNull()
    expect(parseYm('22.3')).toBeNull()
  })

  it('builds an October 2026 grid like the board (27 Sep – 31 Oct)', () => {
    const g = monthGrid(2026, 9)
    expect(g.length).toBe(35)
    expect([g[0]!.getMonth(), g[0]!.getDate()]).toEqual([8, 27])
    expect([g[34]!.getMonth(), g[34]!.getDate()]).toEqual([9, 31])
  })

  it('labels days and deadlines', () => {
    const now = new Date(2026, 9, 20, 10)
    expect(dayTitle(new Date(2026, 9, 21), now)).toBe('10월 21일 수요일 · 내일')
    expect(dday(new Date(2026, 9, 22, 18).toISOString(), now)).toBe('D-2')
    expect(timeAgo(new Date(2026, 9, 20, 8).toISOString(), now)).toBe('2시간 전')
    expect(timeAgo(new Date(2026, 9, 2).toISOString(), now)).toBe('10월 2일')
  })

  it('dates posts older than yesterday as month and day', () => {
    const now = new Date(2026, 9, 20, 10)
    expect(postedAt(new Date(2026, 9, 18, 20).toISOString(), now)).toBe('어제')
    expect(postedAt(new Date(2026, 9, 17, 12).toISOString(), now)).toBe('10월 17일')
    expect(postedAt(new Date(2025, 2, 1).toISOString(), now)).toBe('2025. 3. 1.')
  })

  it('maps stages and offer states to badges', () => {
    expect(offerBadge({ status: 'SENT' }, 'received')).toEqual({ label: '새 제안', solid: false })
    expect(offerBadge({ status: 'READ' }, 'sent').label).toBe('읽음')
    expect(offerBadge({ status: 'ACCEPTED' }, 'sent')).toEqual({ label: '수락함', solid: true })
  })

  it('ymToDate parses 2022.03 to March 2022', () => {
    expect(ymToDate('2022.03')).toEqual(new Date(2022, 2, 1))
  })

  it('ymToDate returns null for empty text', () => {
    expect(ymToDate('')).toBeNull()
  })

  it('dateToYm pads the month', () => {
    expect(dateToYm(new Date(2022, 2, 15))).toBe('2022.03')
  })

  it('toDayParam pads month and day', () => {
    expect(toDayParam(new Date(2026, 9, 3))).toBe('2026-10-03')
  })

  it('fromDayParam round-trips toDayParam', () => {
    const day = new Date(2026, 9, 23)
    expect(fromDayParam(toDayParam(day))).toEqual(day)
  })

  it('fromDayParam rejects bad input', () => {
    expect(fromDayParam('2026-13-01')).toBeNull()
    expect(fromDayParam('nope')).toBeNull()
  })
})
