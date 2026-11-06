import { describe, expect, it } from 'vitest'
import { detailUrl, textSizeScript } from './detail-url'

describe('detail url', () => {
  it('url carries theme and mock', () => {
    expect(detailUrl('https://push.test', '/postings/1', 'dark', true)).toBe('https://push.test/postings/1?theme=dark&mock=1')
  })

  it('url carries theme without mock', () => {
    expect(detailUrl('https://push.test', '/postings/1', 'light', false)).toBe('https://push.test/postings/1?theme=light')
  })

  it('text size rule is important so it beats the page body rule', () => {
    expect(textSizeScript(130)).toContain('html,body{-webkit-text-size-adjust:130%!important}')
  })
})
