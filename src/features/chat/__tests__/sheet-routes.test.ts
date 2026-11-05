import { describe, expect, it } from 'vitest'
import { consentPath, materialsPath, quickStartPath } from '../utils/sheet-routes'

describe('sheet routes', () => {
  it('consent path', () => {
    expect(consentPath()).toBe('/consent')
  })

  it('quick start path', () => {
    expect(quickStartPath('link')).toBe('/quick-start/link')
  })

  it('materials path', () => {
    expect(materialsPath()).toBe('/materials')
  })
})
