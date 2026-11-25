import { describe, expect, it } from 'vitest'
import { avatarTextSize } from './avatar-text'

describe('avatarTextSize', () => {
  it('uses the boards’ initials size for each avatar size the app draws', () => {
    expect([36, 44, 48, 56, 64, 84].map(avatarTextSize)).toEqual([13, 14, 15, 18, 20, 26])
  })
})
