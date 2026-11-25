import { describe, expect, it } from 'vitest'
import { MEMORY_MAX, memoryCount, memoryDraft } from '../utils/memories'

describe('memory utils', () => {
  it('shows the count only once the list loaded', () => {
    expect(memoryCount(undefined)).toBeUndefined()
    expect(memoryCount([])).toBe('0개')
    expect(memoryCount([1, 2, 3])).toBe('3개')
  })

  it('saves a trimmed, changed text within the limit', () => {
    expect(memoryDraft('  주 3일 재택을 원해요  ', '주 2일 재택을 원해요')).toBe('주 3일 재택을 원해요')
    expect(memoryDraft('   ', 'a')).toBeNull()
    expect(memoryDraft(' 같아요 ', '같아요')).toBeNull()
    expect(memoryDraft('가'.repeat(MEMORY_MAX), 'a')).toHaveLength(MEMORY_MAX)
    expect(memoryDraft('가'.repeat(MEMORY_MAX + 1), 'a')).toBeNull()
  })
})
