import { describe, expect, it } from 'vitest'

describe('signed-in terms routes', () => {
  it('keeps document screens inside the authenticated stack', () => {
    expect('/(app)/(stack)/terms-view').toMatch(/\(app\)/)
    expect('/(app)/(stack)/reconsent-terms').toMatch(/\(app\)/)
  })
})
