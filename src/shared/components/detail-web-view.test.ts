import { describe, expect, it } from 'vitest'
import { detailFrom, detailUrl, textSizeScript } from './detail-url'

describe('detail url', () => {
  it('url carries theme and mock', () => {
    expect(detailUrl('https://push.test', '/postings/1', 'dark', true)).toBe('https://push.test/postings/1?theme=dark&mock=1')
  })

  it('url carries theme without mock', () => {
    expect(detailUrl('https://push.test', '/postings/1', 'light', false)).toBe('https://push.test/postings/1?theme=light')
  })

  it('url carries from only for the lists that open a page', () => {
    expect(detailUrl('https://push.test', '/profiles/u2', 'light', false, 'following')).toBe('https://push.test/profiles/u2?theme=light&from=following')
    expect(detailUrl('https://push.test', '/postings/p1', 'light', true, 'bookmark')).toBe('https://push.test/postings/p1?theme=light&mock=1&from=bookmark')
  })

  it('reads from out of route params and drops anything unknown', () => {
    expect(detailFrom('following')).toBe('following')
    expect(detailFrom(['bookmark', 'x'])).toBe('bookmark')
    expect(detailFrom('hub')).toBeUndefined()
    expect(detailFrom(undefined)).toBeUndefined()
  })

  it('text size rule is important so it beats the page body rule', () => {
    expect(textSizeScript(130)).toContain('html,body{-webkit-text-size-adjust:130%!important}')
  })
})
