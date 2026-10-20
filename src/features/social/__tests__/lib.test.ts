import { describe, expect, it } from 'vitest'
import { givenName, threadComments, timeAgo } from '../lib'

const now = new Date(2026, 9, 20, 12, 0)
const ago = (ms: number) => new Date(now.getTime() - ms).toISOString()

describe('timeAgo', () => {
  it('formats recent times', () => {
    expect(timeAgo(ago(10_000), now)).toBe('방금 전')
    expect(timeAgo(ago(5 * 60_000), now)).toBe('5분 전')
    expect(timeAgo(ago(2 * 3600_000), now)).toBe('2시간 전')
    expect(timeAgo(ago(30 * 3600_000), now)).toBe('어제')
    expect(timeAgo(ago(3 * 86400_000), now)).toBe('3일 전')
  })
  it('falls back to dates', () => {
    expect(timeAgo(new Date(2026, 9, 2).toISOString(), now)).toBe('10월 2일')
    expect(timeAgo(new Date(2025, 2, 1).toISOString(), now)).toBe('2025. 3. 1.')
  })
  it('treats future times as now', () => {
    expect(timeAgo(ago(-60_000), now)).toBe('방금 전')
  })
})

describe('threadComments', () => {
  const u = { id: 'u', displayName: 'x' }
  const c = (id: string, parentId?: string) => ({ id, parentId, author: u, body: '', createdAt: '' })
  it('puts replies under their parent', () => {
    const out = threadComments([c('a'), c('b'), c('r1', 'a'), c('r2', 'zz')])
    expect(out.map((x) => [x.id, x.reply])).toEqual([['a', false], ['r1', true], ['b', false], ['r2', true]])
  })
})

it('givenName', () => {
  expect(givenName('이수빈')).toBe('수빈')
  expect(givenName('Alex')).toBe('Al')
})
