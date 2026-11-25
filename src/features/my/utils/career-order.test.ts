import { describe, expect, it } from 'vitest'
import { dropIndex, indexAfterMove, moveItem } from './career-order'

describe('moveItem', () => {
  it('moves an item down and up', () => {
    expect(moveItem(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a'])
    expect(moveItem(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b'])
    expect(moveItem(['a', 'b'], 1, 1)).toEqual(['a', 'b'])
  })
})

describe('dropIndex', () => {
  const heights = [100, 60, 60, 60]
  it('passes a neighbour after half of its height plus the gap', () => {
    expect(dropIndex(heights, 0, 37, 16)).toBe(0)
    expect(dropIndex(heights, 0, 39, 16)).toBe(1)
    expect(dropIndex(heights, 0, 76 + 39, 16)).toBe(2)
    expect(dropIndex(heights, 0, 1000, 16)).toBe(3)
  })
  it('moves up and stops at the top', () => {
    expect(dropIndex(heights, 3, -39, 16)).toBe(2)
    expect(dropIndex(heights, 1, -1000, 16)).toBe(0)
    expect(dropIndex(heights, 2, 0, 16)).toBe(2)
  })
})

describe('indexAfterMove', () => {
  it('follows the moved card and shifts the ones it passed', () => {
    expect(indexAfterMove(0, 0, 2)).toBe(2)
    expect(indexAfterMove(2, 0, 2)).toBe(1)
    expect(indexAfterMove(0, 2, 0)).toBe(1)
    expect(indexAfterMove(3, 0, 2)).toBe(3)
    expect(indexAfterMove(null, 0, 2)).toBe(null)
  })
})
