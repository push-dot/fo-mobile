import { beforeEach, describe, expect, it, vi } from 'vitest'

const opened = { browser: [] as string[], system: [] as string[] }

vi.mock('expo-clipboard', () => ({}))
vi.mock('expo-document-picker', () => ({}))
vi.mock('expo-haptics', () => ({}))
vi.mock('expo-image-picker', () => ({}))
vi.mock('expo-linking', () => ({}))
vi.mock('expo-web-browser', () => ({ openBrowserAsync: async (url: string) => void opened.browser.push(url) }))
vi.mock('react-native', () => ({ Linking: { openURL: async (url: string) => void opened.system.push(url) }, Platform: { OS: 'ios' }, Share: {} }))

const { openBrowser, openUrl } = await import('./platform')

describe('opening URLs from data', () => {
  beforeEach(() => {
    opened.browser.length = 0
    opened.system.length = 0
  })

  it('opens web pages and the support mail', async () => {
    await openBrowser('https://careers.moapay.kr/jobs/1182')
    await openUrl('https://github.com/kim')
    await openUrl('mailto:support@push.devcyjoon.tech')
    expect(opened.browser).toEqual(['https://careers.moapay.kr/jobs/1182'])
    expect(opened.system).toEqual(['https://github.com/kim', 'mailto:support@push.devcyjoon.tech'])
  })

  it.each(['push://offers/o1/accept', 'javascript:alert(1)', 'tel:0100000000', 'intent://x#Intent;scheme=evil;end', 'file:///etc/hosts'])(
    'does not hand %s to the OS or the browser',
    async (url) => {
      await openBrowser(url)
      await openUrl(url)
      expect(opened).toEqual({ browser: [], system: [] })
    },
  )
})
