import { describe, expect, it } from 'vitest'
import { detailFrom, detailUrl, HOLD_FIT_SCRIPT, textSizeScript } from './detail-url'

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

describe('mock fit hold script (JobFit)', () => {
  const delays: number[] = []
  let stack = ''
  const win = { setTimeout: (_f: unknown, ms: number) => void delays.push(ms) }
  // The script reads the caller from the stack of an Error it creates, so the test supplies the stack.
  const FakeError = function () {
    return { stack }
  } as unknown as ErrorConstructor
  new Function('window', 'Error', HOLD_FIT_SCRIPT)(win, FakeError)

  it('waits 60 s for a zero-delay timer set from fit-card.tsx', () => {
    delays.length = 0
    stack = 'anonymous@\n@http://localhost:5174/src/pages/posting/fit-card.tsx:41:30\nloadMockFit@http://localhost:5174/src/pages/posting/fit-card.tsx:40:9'
    win.setTimeout(() => undefined, 0)
    expect(delays).toEqual([60000])
  })

  it('leaves timers set by other files, or with a delay, alone', () => {
    delays.length = 0
    stack = 'anonymous@\n@http://localhost:5174/src/shared/api/mock-loader.ts:9:5\nloadMock@http://localhost:5174/src/shared/api/mock-loader.ts:5:3\nloadMockFit@http://localhost:5174/src/pages/posting/fit-card.tsx:40:9'
    win.setTimeout(() => undefined, 0)
    stack = 'anonymous@\n@http://localhost:5174/src/pages/posting/fit-card.tsx:41:30'
    win.setTimeout(() => undefined, 250)
    expect(delays).toEqual([0, 250])
  })
})
