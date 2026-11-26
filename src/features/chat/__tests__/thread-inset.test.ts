import { describe, expect, it } from 'vitest'
import { threadBottomGap } from '../utils/thread-inset'

describe('threadBottomGap', () => {
  it('sits 8 above the composer with the keyboard up at any composer height and 16 at rest', () => {
    expect(threadBottomGap(336)).toBe(8)
    expect(threadBottomGap(0)).toBe(16)
  })

  it('takes only the keyboard height, so composer growth cannot move the gap (the list already shrinks with KeyboardAvoidingView)', () => {
    expect(threadBottomGap).toHaveLength(1)
  })
})
