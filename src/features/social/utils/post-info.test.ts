import { describe, expect, it } from 'vitest'
import { postInfo } from './post-info'

const now = new Date(2026, 9, 20, 12, 0)

describe('postInfo', () => {
  it('joins author, category, and time', () => {
    expect(
      postInfo(
        {
          author: { id: 'u', displayName: '이수빈' },
          category: 'career',
          createdAt: new Date(2026, 9, 20, 10, 0).toISOString(),
        },
        now,
      ),
    ).toBe('이수빈 · 커리어 · 2시간 전')
  })
})
