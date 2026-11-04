import { describe, expect, it } from 'vitest'
import { authorLine, postInfo } from './post-info'

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

  it('hides view counts on the feed and shows them on the detail line', () => {
    const post = { category: 'daily' as const, createdAt: new Date(2026, 9, 20, 8, 0).toISOString(), viewCount: 238 }
    expect(authorLine(post, false, now)).toBe('일상 · 4시간 전')
    expect(authorLine(post, true, now)).toBe('일상 · 4시간 전 · 조회 238')
  })
})
