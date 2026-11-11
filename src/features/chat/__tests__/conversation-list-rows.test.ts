import { describe, expect, it } from 'vitest'
import { flattenConversationGroups } from '../utils/conversation-list-rows'
import type { ConversationRow } from '../api/schemas'

const row = (id: string): ConversationRow => ({
  id,
  revision: 1,
  applicationId: null,
  title: id,
  pinned: false,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
})

describe('flattenConversationGroups', () => {
  it('interleaves section headers and conversation rows', () => {
    const flat = flattenConversationGroups([
      { rows: [row('p1')] },
      { title: '오늘', rows: [row('a'), row('b')] },
    ])
    expect(flat.map((x) => (x.kind === 'header' ? `h:${x.title}` : x.key))).toEqual([
      'p1',
      'h:오늘',
      'a',
      'b',
    ])
    expect(flat.find((x) => x.kind === 'header' && x.title === '오늘')).toMatchObject({ firstTitled: true })
  })
})
