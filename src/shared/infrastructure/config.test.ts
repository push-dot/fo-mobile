import { describe, expect, it } from 'vitest'
import { PRODUCTION_WEB_URL, webBaseUrl } from './config'

describe('webBaseUrl', () => {
  it('uses the env value when set', () => {
    expect(webBaseUrl('https://web.test', false)).toBe('https://web.test')
  })

  it('falls back to localhost only in dev', () => {
    expect(webBaseUrl(undefined, true)).toBe('http://localhost:5174')
  })

  it('falls back to the production web in a release build', () => {
    expect(webBaseUrl(undefined, false)).toBe(PRODUCTION_WEB_URL)
    expect(webBaseUrl('', false)).toBe(PRODUCTION_WEB_URL)
  })
})
