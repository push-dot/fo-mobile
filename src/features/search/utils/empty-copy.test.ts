import { describe, expect, it } from 'vitest'
import { searchEmptyTitle } from './empty-copy'

describe('search empty title', () => {
  it('names the query', () => {
    expect(searchEmptyTitle('데브옵스 인턴')).toBe('‘데브옵스 인턴’에 맞는 결과가 없어요.')
  })
})
