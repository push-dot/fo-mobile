import { describe, expect, it } from 'vitest'
import { lateSpec } from '../late-spec'

describe('lateSpec', () => {
  it('lands a bot answer at once, or after the delay the link names', () => {
    expect(lateSpec('bot:b-moa:late')).toEqual({ bot: 'b-moa', delayMs: 0 })
    expect(lateSpec('bot:b-moa:late:6000')).toEqual({ bot: 'b-moa', delayMs: 6000 })
  })

  it('ignores other bot switches', () => {
    expect(lateSpec('bot:b-moa:read')).toBeNull()
    expect(lateSpec('bot:b-moa:late:soon')).toBeNull()
  })
})
