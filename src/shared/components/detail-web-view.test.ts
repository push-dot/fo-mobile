import { describe, expect, it } from 'vitest'
import { detailUrl } from './detail-url'

describe('detail url', () => {
  it('url carries theme and mock', () => {
    expect(detailUrl('https://push.test', '/postings/1', 'dark', true)).toBe('https://push.test/postings/1?theme=dark&mock=1')
  })

  it('url carries theme without mock', () => {
    expect(detailUrl('https://push.test', '/postings/1', 'light', false)).toBe('https://push.test/postings/1?theme=light')
  })
})
