import { describe, expect, it } from 'vitest'
import { cacheName } from '../utils/cache-name'

describe('cacheName', () => {
  it('keeps cache file names inside the cache directory', () => {
    expect(cacheName('../05_최종 이력서.pdf')).toBe('.._05_최종_이력서.pdf')
    expect(cacheName('')).toBe('artifact')
    expect(cacheName('05_final_resume.pdf')).toBe('05_final_resume.pdf')
  })
})
