import { describe, expect, it } from 'vitest'
import { recent, RECENT_LIMIT } from './recent'

describe('recent', () => {
  it('keeps the first 3 of a longer list', () => expect(recent([1, 2, 3, 4, 5])).toEqual([1, 2, 3]))
  it('returns a shorter list whole', () => expect(recent([1, 2])).toEqual([1, 2]))
  it('takes a custom limit and never a negative one', () => {
    expect(recent([1, 2, 3, 4], 2)).toEqual([1, 2])
    expect(recent([1, 2], -1)).toEqual([])
  })
  it('does not change the list it was given', () => {
    const list = [1, 2, 3, 4]
    recent(list)
    expect(list).toEqual([1, 2, 3, 4])
    expect(RECENT_LIMIT).toBe(3)
  })
})
