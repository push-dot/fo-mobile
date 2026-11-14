import { describe, expect, it } from 'vitest'

import { DISABLED_OPACITY } from './constants'

describe('DISABLED_OPACITY', () => {
  it('dims the accent button to the boards #B5AEF8 over white', () => {
    const [r, g, b] = [0x5b, 0x4c, 0xf0].map((v) => Math.round(255 - DISABLED_OPACITY * (255 - v)))
    expect([r, g, b]).toEqual([0xb5, 0xae, 0xf8])
  })
})
