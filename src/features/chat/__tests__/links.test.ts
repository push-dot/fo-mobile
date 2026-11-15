import { describe, expect, it } from 'vitest'
import { fullLinkUrl, kindOf } from '../utils/links'

describe('kindOf', () => {
  it('picks the kind from the address', () => {
    expect(kindOf('github.com/seojun-kim/payment-gateway')).toBe('github')
    expect(kindOf('https://velog.io/@seojun/p99')).toBe('blog')
    expect(kindOf('https://seojun.notion.site')).toBe('portfolio')
    expect(kindOf('https://careers.moapay.kr/jobs/1182')).toBe('job')
    expect(kindOf('https://example.com')).toBe('other')
  })
})

describe('fullLinkUrl', () => {
  it('turns owner/repo with GitHub picked into the repo address', () => {
    expect(fullLinkUrl('seojun-kim/payment-gateway', 'github')).toBe('https://github.com/seojun-kim/payment-gateway')
  })

  it('adds https:// only when the address has none', () => {
    expect(fullLinkUrl('github.com/seojun-kim/payment-gateway', 'github')).toBe('https://github.com/seojun-kim/payment-gateway')
    expect(fullLinkUrl('seojun-kim/payment-gateway', null)).toBe('https://seojun-kim/payment-gateway')
    expect(fullLinkUrl(' http://example.com ', 'other')).toBe('http://example.com')
  })
})
