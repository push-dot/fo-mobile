import { describe, expect, it } from 'vitest'
import { ApiError } from '@push/api-client'
import { botErrorCopy, botErrorKind } from './errors'

describe('bot errors', () => {
  it('maps BOT_LIMIT with details', () => {
    const e = new ApiError('limit', 'BOT_LIMIT', 403, { limit: 3, plan: 'FREE' })
    expect(botErrorKind(e)).toBe('limit')
    const copy = botErrorCopy(e)
    expect(copy.body).toContain('FREE')
    expect(copy.body).toContain('3')
  })

  it('maps BOT_LIMIT without details to generic copy', () => {
    const e = new ApiError('limit', 'BOT_LIMIT', 403, null)
    expect(botErrorCopy(e).body).toBe('요금제에서 만들 수 있는 회사 봇 수에 도달했어요.')
  })

  it('maps DEFAULT_BOT_PROTECTED', () => {
    const e = new ApiError('x', 'DEFAULT_BOT_PROTECTED', 403)
    expect(botErrorKind(e)).toBe('protected')
    expect(botErrorCopy(e).body).toContain('Push Bot')
  })

  it('maps REVISION_CONFLICT', () => {
    const e = new ApiError('x', 'REVISION_CONFLICT', 409)
    expect(botErrorKind(e)).toBe('conflict')
  })

  it('maps other errors', () => {
    expect(botErrorKind(new Error('x'))).toBe('other')
    expect(botErrorKind(new ApiError('x', 'NOT_FOUND', 404))).toBe('other')
  })
})
