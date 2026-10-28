import { describe, expect, it } from 'vitest'
import { kindOf } from '../utils/links'

describe('kindOf', () => {
  it('picks the kind from the address', () => {
    expect(kindOf('github.com/seojun-kim/payment-gateway')).toBe('github')
    expect(kindOf('https://velog.io/@seojun/p99')).toBe('blog')
    expect(kindOf('https://seojun.notion.site')).toBe('portfolio')
    expect(kindOf('https://careers.moapay.kr/jobs/1182')).toBe('job')
    expect(kindOf('https://example.com')).toBe('other')
  })
})
