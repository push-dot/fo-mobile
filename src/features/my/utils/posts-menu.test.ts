import { describe, expect, it, vi } from 'vitest'
import { postsMenu, postsTitle } from './posts-menu'

const pick = () => ({ view: vi.fn(), sort: vi.fn() })

describe('postsMenu', () => {
  it('is a 보기 group of the three views and a 정렬 group of the three sorts, each with a check on the current one', () => {
    const menu = postsMenu({ view: 'commented', sort: 'views' }, pick())
    expect(menu.map((s) => [s.title, s.check])).toEqual([
      ['보기', 'trailing'],
      ['정렬', 'trailing'],
    ])
    expect(menu.map((s) => s.actions.map((a) => [a.label, !!a.selected]))).toEqual([
      [
        ['내가 쓴 글', false],
        ['댓글 단 글', true],
        ['저장한 글', false],
      ],
      [
        ['최신순', false],
        ['조회 많은 순', true],
        ['댓글 많은 순', false],
      ],
    ])
  })

  it('reports the picked view and the picked sort', () => {
    const p = pick()
    const menu = postsMenu({ view: 'mine', sort: 'latest' }, p)
    menu[0]!.actions[2]!.onPress()
    menu[1]!.actions[2]!.onPress()
    expect(p.view).toHaveBeenCalledWith('saved')
    expect(p.sort).toHaveBeenCalledWith('comments')
  })

  it('gives every item a SF Symbol for iOS and a design icon for Android', () => {
    for (const a of postsMenu({ view: 'mine', sort: 'latest' }, pick()).flatMap((s) => s.actions)) {
      expect(a.systemImage).toBeTruthy()
      expect(a.icon).toBeTruthy()
    }
  })
})

describe('postsTitle', () => {
  it('follows the chosen view', () => {
    expect((['mine', 'commented', 'saved'] as const).map(postsTitle)).toEqual(['내가 쓴 글', '댓글 단 글', '저장한 글'])
  })
})
