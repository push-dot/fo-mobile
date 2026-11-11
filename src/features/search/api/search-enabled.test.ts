import { describe, expect, it } from 'vitest'
import { searchEnabled } from './search-enabled'

describe('searchEnabled', () => {
  it('is false when the query is empty', () => {
    expect(searchEnabled('', true)).toBe(false)
    expect(searchEnabled('', false)).toBe(false)
  })

  it('follows the active tab flag when the query has text', () => {
    expect(searchEnabled('카카오', true)).toBe(true)
    expect(searchEnabled('카카오', false)).toBe(false)
  })
})
