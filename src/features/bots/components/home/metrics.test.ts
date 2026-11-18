import { describe, expect, it, vi } from 'vitest'

vi.mock('../../../../theme', async () => ({ spacing: (await import('../../../../theme/tokens')).spacing }))

const { homeChrome } = await import('./metrics')

describe('homeChrome', () => {
  it('fixes the text size only in the XL board, where the board draws pixels', () => {
    expect(homeChrome(true).noScale).toBe(false)
    expect(homeChrome(false).noScale).toBeUndefined()
  })
})
