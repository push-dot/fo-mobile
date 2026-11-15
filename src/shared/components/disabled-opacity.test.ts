import { describe, expect, it } from 'vitest'

import { DISABLED_OPACITY, PENDING_OPACITY } from './constants'

const overWhite = (opacity: number) => [0x5b, 0x4c, 0xf0].map((v) => Math.round(255 - opacity * (255 - v)))

describe('button dimming', () => {
  it('dims a disabled accent button to the boards #BDB7F8 over white (SignInErrors, PhoneCode, PlanUltra)', () => {
    overWhite(DISABLED_OPACITY).forEach((v, i) => expect(Math.abs(v - [0xbd, 0xb7, 0xf8][i]!)).toBeLessThanOrEqual(1))
  })

  it('dims a running or finished action to the boards #B5AEF8 (지원하는 중…, 보내는 중, 지원 완료)', () => {
    expect(overWhite(PENDING_OPACITY)).toEqual([0xb5, 0xae, 0xf8])
  })
})
