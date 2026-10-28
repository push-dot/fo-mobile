import { describe, expect, it } from 'vitest'
import { filterMentions, insertMention, mentionQuery, type MentionGroup } from '../utils/mentions'

const groups: MentionGroup[] = [
  { title: '북마크 공고', items: [{ id: 'p', kind: 'job', title: '백엔드 엔지니어 (Kotlin·Spring)', sub: '모아페이 · 서울 강남구' }] },
  {
    title: '마이 › 서류',
    items: [
      { id: 'd1', kind: 'doc', title: '경력기술서_모아페이.docx', sub: '9월 28일 · 640KB' },
      { id: 'd2', kind: 'doc', title: '포트폴리오_결제시스템.pdf', sub: '8월 3일' },
    ],
  },
  { title: '바로가기', items: [{ id: 's', kind: 'shortcut', title: '캘린더 관리', sub: '' }] },
]

describe('mentions', () => {
  it('reads the query after a word-starting @', () => {
    expect(mentionQuery('@모아')).toBe('모아')
    expect(mentionQuery('이거 @')).toBe('')
    expect(mentionQuery('mail@x')).toBeNull()
    expect(mentionQuery('@모아 끝')).toBeNull()
  })

  it('filters by title or sub and hides empty groups', () => {
    const out = filterMentions(groups, '모아')
    expect(out.map((g) => g.title)).toEqual(['북마크 공고', '마이 › 서류'])
    expect(out[1]!.items.map((i) => i.id)).toEqual(['d1'])
    // Highlight range is on the title only; the job matched through its sub.
    expect(out[0]!.items[0]!.hit).toBeNull()
    expect(out[1]!.items[0]!.hit).toMatchObject({ start: 6, end: 8 })
  })

  it('matches choseong while typing', () => {
    expect(filterMentions(groups, 'ㅋㄹㄷ').map((g) => g.title)).toEqual(['바로가기'])
  })

  it('shows everything for a bare @', () => {
    expect(filterMentions(groups, '')).toHaveLength(3)
  })

  it('inserts the picked title', () => {
    expect(insertMention('이거 봐 @모아', '경력기술서_모아페이.docx')).toBe('이거 봐 @경력기술서_모아페이.docx ')
  })
})
