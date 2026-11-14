import { describe, expect, it } from 'vitest'
import { fromFirst, matchItemId, matchLabel, prependOlder, revealMatch, splitMarks, stepMatch } from '../utils/find'
import type { ChatItem } from '../types'

const user = (id: string): ChatItem => ({ type: 'user', id, text: id })
const bot = (id: string): ChatItem => ({ type: 'agentText', id, text: id })
const match = (messageId: string, turnId: string) => ({ messageId, turnId, at: '2026-11-12T09:00:00Z' })

describe('stepMatch', () => {
  it('starts at the newest and steps to older results, wrapping at the ends', () => {
    expect(stepMatch(0, 3, 'older')).toBe(1)
    expect(stepMatch(2, 3, 'older')).toBe(0)
    expect(stepMatch(0, 3, 'newer')).toBe(2)
    expect(stepMatch(1, 3, 'newer')).toBe(0)
  })

  it('stays put with no results', () => {
    expect(stepMatch(0, 0, 'older')).toBe(0)
  })
})

describe('matchLabel', () => {
  it('counts from one and is blank with no results', () => {
    expect(matchLabel(1, 3)).toBe('2/3')
    expect(matchLabel(0, 0)).toBe('')
  })
})

describe('matchItemId', () => {
  const items = [user('m1'), bot('t1:4'), user('m2')]

  it('finds a user line by message id and a bot line by its turn', () => {
    expect(matchItemId(match('m2', 't2'), items)).toBe('m2')
    expect(matchItemId(match('a-9', 't1'), items)).toBe('t1:4')
  })

  it('finds nothing for a turn that is not loaded', () => {
    expect(matchItemId(match('a-0', 't0'), items)).toBeUndefined()
  })
})

describe('revealMatch', () => {
  it('pages older turns in until the match has a line', async () => {
    let items: ChatItem[] = [user('m9')]
    const pages = [[user('m5')], [bot('t3:1')]]
    let loaded = 0
    const id = await revealMatch(match('x', 't3'), {
      items: () => items,
      hasOlder: () => loaded < pages.length,
      loadOlder: async () => {
        items = [...pages[loaded]!, ...items]
        loaded++
      },
    })
    expect(id).toBe('t3:1')
    expect(loaded).toBe(2)
  })

  it('does not page when the line is already there', async () => {
    let calls = 0
    const id = await revealMatch(match('m1', 't1'), { items: () => [user('m1')], hasOlder: () => true, loadOlder: async () => void calls++ })
    expect(id).toBe('m1')
    expect(calls).toBe(0)
  })

  it('gives up once the whole history is loaded', async () => {
    expect(await revealMatch(match('x', 't0'), { items: () => [user('m1')], hasOlder: () => false, loadOlder: async () => {} })).toBeUndefined()
  })
})

describe('prependOlder', () => {
  it('puts older lines first and renames one that reuses a shown id', () => {
    const tool = (id: string): ChatItem => ({ type: 'tool', id, action: '찾기', state: 'ok' })
    const next = prependOlder([tool('tool-1'), user('m2')], [user('m1'), tool('tool-1')])
    expect(next.map((i) => i.id)).toEqual(['m1', 'older-tool-1', 'tool-1', 'm2'])
  })
})

describe('fromFirst', () => {
  const note = (id: string): ChatItem => ({ type: 'notice', id, notice: { kind: 'stopped', resumable: true } })
  it('drops the lines before the first one of the type and keeps the rest', () => {
    expect(fromFirst([user('m1'), note('n1'), user('m2'), note('n2')], 'notice').map((i) => i.id)).toEqual(['n1', 'm2', 'n2'])
  })

  it('keeps the whole thread when no line has the type', () => {
    expect(fromFirst([user('m1'), user('m2')], 'todo').map((i) => i.id)).toEqual(['m1', 'm2'])
  })
})

describe('splitMarks', () => {
  it('marks every case-insensitive hit and keeps the rest', () => {
    expect(splitMarks('좋아요 PDF로 보여 주세요, pdf도요', 'pdf')).toEqual([
      { text: '좋아요 ', hit: false },
      { text: 'PDF', hit: true },
      { text: '로 보여 주세요, ', hit: false },
      { text: 'pdf', hit: true },
      { text: '도요', hit: false },
    ])
  })

  it('treats the query as text, not a pattern', () => {
    expect(splitMarks('a.b (c)', '.b (')).toEqual([
      { text: 'a', hit: false },
      { text: '.b (', hit: true },
      { text: 'c)', hit: false },
    ])
  })

  it('draws a blank query plain', () => {
    expect(splitMarks('안녕', '  ')).toEqual([{ text: '안녕', hit: false }])
  })
})
