import { describe, expect, it } from 'vitest'
import { composerWeight } from '../utils/composer-weight'

describe('composerWeight', () => {
  it('draws a mention being typed at 600 (ChatEmpty "@모아", ChatMention "@")', () => {
    expect(composerWeight('@')).toBe('600')
    expect(composerWeight('@모아')).toBe('600')
  })

  it('draws every other typed line at 400 (ChatKeyboardIOS)', () => {
    expect(composerWeight('')).toBe('400')
    expect(composerWeight('누리클라우드 공고에도 맞춰 줘')).toBe('400')
    expect(composerWeight('@모아페이 이력서 고쳐 줘')).toBe('400')
    expect(composerWeight('메일 주소는 a@b.kr')).toBe('400')
  })
})
