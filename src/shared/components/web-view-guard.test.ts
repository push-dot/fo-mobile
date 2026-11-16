import { describe, expect, it } from 'vitest'
import { bootScript, loadsInWebView, tokenEventScript, webViewNavigation } from './detail-url'

const WEB = 'https://push-fo-web.example.dev'

type Page = { location: { origin: string }; window: { __PUSH__?: { token?: string | null } }; events: unknown[] }

const run = (script: string, origin: string): Page => {
  const page: Page = { location: { origin }, window: {}, events: [] }
  const win = Object.assign(page.window, {
    dispatchEvent: (e: unknown) => void page.events.push(e),
  })
  const CustomEvent = function (this: unknown, type: string, init: unknown) {
    return { type, init }
  }
  new Function('window', 'location', 'CustomEvent', script)(win, page.location, CustomEvent)
  return page
}

describe('WebView token hand-off', () => {
  it('gives the token to the fo-web page', () => {
    expect(run(bootScript(WEB, { token: 'tok-1', theme: 'dark' }), WEB).window.__PUSH__?.token).toBe('tok-1')
    expect(run(tokenEventScript(WEB, 'tok-2'), WEB).events).toHaveLength(1)
  })

  it.each(['https://push-fo-web.example.dev.attacker.test', 'https://attacker.test', 'http://push-fo-web.example.dev'])(
    'gives no token to a page on %s',
    (origin) => {
      expect(run(bootScript(WEB, { token: 'tok-1', theme: 'dark' }), origin).window.__PUSH__).toBeUndefined()
      expect(run(tokenEventScript(WEB, 'tok-2'), origin).events).toHaveLength(0)
    },
  )
})

describe('WebView navigation', () => {
  it('loads fo-web pages', () => {
    expect(loadsInWebView(`${WEB}/postings/p1?theme=dark`, WEB)).toBe(true)
    expect(loadsInWebView(WEB, WEB)).toBe(true)
  })

  it.each([
    'https://push-fo-web.example.dev.attacker.test/',
    'https://push-fo-web.example.dev@attacker.test/',
    'https://push-fo-web.example.dev:8443/',
    'http://push-fo-web.example.dev/',
    'javascript:alert(1)',
  ])('does not load %s in the token-bearing WebView', (url) => {
    expect(loadsInWebView(url, WEB)).toBe(false)
  })
})

describe('WebView navigation routing', () => {
  it.each([`${WEB}/postings/p1?theme=dark`, WEB, 'about:blank'])('loads %s in the WebView', (url) => {
    expect(webViewNavigation(url, WEB)).toBe('load')
  })

  it.each([
    'https://other.example/page',
    'http://other.example/',
    'https://push-fo-web.example.dev.attacker.test/',
    'https://push-fo-web.example.dev@attacker.test/',
  ])('sends %s to the browser', (url) => {
    expect(webViewNavigation(url, WEB)).toBe('browser')
  })

  it.each(['intent://scan#Intent;scheme=zxing;end', 'push://open/settings', 'tel:+821012345678', 'javascript:alert(1)', 'file:///etc/passwd', 'mailto:a@b.test', ''])(
    'ignores %s',
    (url) => {
      expect(webViewNavigation(url, WEB)).toBe('ignore')
    },
  )
})
