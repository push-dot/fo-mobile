import { describe, expect, it } from 'vitest'
import { chatDocFromSource } from '../utils/docs'

describe('doc origin', () => {
  it('AI origin sets aiMade', () => {
    expect(chatDocFromSource({ id: '1', fileName: 'a.pdf', size: 1, createdAt: '2026-11-05T00:00:00.000Z', origin: 'AI' }).aiMade).toBe(true)
  })

  it('other origin does not', () => {
    expect(chatDocFromSource({ id: '1', fileName: 'a.pdf', size: 1, createdAt: null, origin: 'UPLOAD' }).aiMade).toBe(false)
  })
})
