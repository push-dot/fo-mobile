import { describe, expect, it } from 'vitest'
import { firstParam } from '@/shared/utility/first-param'
import { botAddressParam } from './bot-address-param'

describe('firstParam', () => {
  it('returns a single value as is', () => {
    expect(firstParam('a')).toBe('a')
  })

  it('returns the first entry of a repeated param', () => {
    expect(firstParam(['a', 'b'])).toBe('a')
  })

  it('returns undefined for a missing or empty param', () => {
    expect(firstParam(undefined)).toBeUndefined()
    expect(firstParam([])).toBeUndefined()
  })
})

describe('botAddressParam', () => {
  it('keeps a string bot id', () => {
    expect(botAddressParam('bot-1')).toBe('bot-1')
  })

  it('falls back to push for anything else', () => {
    expect(botAddressParam(undefined)).toBe('push')
    expect(botAddressParam(['bot-1'])).toBe('push')
  })
})
