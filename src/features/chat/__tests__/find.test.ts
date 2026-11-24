import { describe, expect, it } from 'vitest'
import { fromFirst, hitCount, hitOf, hitsBefore, markRects, matchItemId, matchLabel, prependOlder, revealMatch, splitMarks, stepMatch, type TextLine } from '../utils/find'
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

  it('starts at the nth line of the type, or the last one', () => {
    const items = [user('m1'), bot('b1'), user('m2'), bot('b2'), user('m3')]
    expect(fromFirst(items, 'agentText', 2).map((i) => i.id)).toEqual(['b2', 'm3'])
    expect(fromFirst(items, 'user', 'last').map((i) => i.id)).toEqual(['m3'])
    expect(fromFirst(items, 'user', 4).map((i) => i.id)).toEqual(['m1', 'b1', 'm2', 'b2', 'm3'])
  })

  it('keeps the whole thread when no line has the type', () => {
    expect(fromFirst([user('m1'), user('m2')], 'surface').map((i) => i.id)).toEqual(['m1', 'm2'])
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

describe('markRects', () => {
  const line = (y: number): TextLine => ({ x: 0, y, width: 300, height: 23, ascender: 17 })

  it('boxes a mark on one line as the board draws it: the font content area around the baseline', () => {
    const [box] = markRects([line(0), line(23)], { left: { x: 100, y: 17 }, right: { x: 133, y: 17 } }, 16)
    expect(box).toEqual({ left: 100, width: 33, top: 17 - 1.16 * 16, height: 1.448 * 16 })
  })

  it('splits a mark that wraps into the end of its first line, whole middle lines and the start of its last', () => {
    const lines = [line(0), line(23), line(46)]
    const rects = markRects(lines, { left: { x: 250, y: 17 }, right: { x: 40, y: 63 } }, 16)
    expect(rects.map((r) => [r.left, r.width])).toEqual([[250, 50], [0, 300], [0, 40]])
  })

  it('draws nothing while an edge has no line yet', () => {
    expect(markRects([], { left: { x: 1, y: 1 }, right: { x: 2, y: 1 } }, 16)).toEqual([])
  })
})

describe('hitOf', () => {
  const list = [match('a', 't2'), match('r', 't1'), match('r', 't1')]

  it('numbers the hits of a message in reading order, the newest (last in reading order) coming first', () => {
    expect([0, 1, 2].map((i) => hitOf(list, i))).toEqual([0, 1, 0])
  })

  it('is the first hit for a server that returns one match per message', () => {
    expect(hitOf([match('a', 't2'), match('r', 't1')], 1)).toBe(0)
  })
})

describe('hitCount', () => {
  it('counts the hits of a line, none without a query', () => {
    expect(hitCount('Push 프로필에 이미 있고 프로필만', '프로필')).toBe(2)
    expect(hitCount('Push 프로필에', '')).toBe(0)
  })
})

describe('hitsBefore', () => {
  it('counts the hits above each line, so the line holding the current hit can be told apart', () => {
    expect(hitsBefore(['Push 프로필에 이미 드러나 있고', '결제 승인 API', 'Kafka 경험은 프로필에서 한 줄로'], '프로필')).toEqual([0, 1, 1])
  })
})
