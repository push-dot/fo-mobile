import { partialMatchKey } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import { CHAT_DOCS_KEY } from '../constants'

describe('CHAT_DOCS_KEY', () => {
  it('refreshes when my sources are invalidated', () => {
    expect(partialMatchKey(CHAT_DOCS_KEY, ['me', 'sources'])).toBe(true)
  })
})
