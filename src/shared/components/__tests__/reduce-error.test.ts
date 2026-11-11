import { describe, expect, it } from 'vitest'
import { reduceError } from '../reduce-error'

describe('reduceError', () => {
  it('enters error state', () => {
    expect(reduceError('ok', 'error')).toBe('error')
  })

  it('clears error on retry', () => {
    expect(reduceError('error', 'retry')).toBe('ok')
  })

  it('stays ok when retry is sent without error', () => {
    expect(reduceError('ok', 'retry')).toBe('ok')
  })
})
