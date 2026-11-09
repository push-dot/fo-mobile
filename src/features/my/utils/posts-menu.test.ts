import { describe, expect, it, vi } from 'vitest'
import { postsMenu, postsTitle } from './posts-menu'

describe('postsMenu', () => {
  it('is one 보기 group of the two views with a check on the current one, and no sort group', () => {
    const menu = postsMenu('commented', vi.fn())
    expect(menu).toHaveLength(1)
    expect(menu[0]!.title).toBe('보기')
    expect(menu[0]!.check).toBe('trailing')
    expect(menu[0]!.actions.map((a) => [a.label, !!a.selected])).toEqual([
      ['내가 쓴 글', false],
      ['댓글 단 글', true],
    ])
  })

  it('reports the picked view', () => {
    const pick = vi.fn()
    postsMenu('mine', pick)[0]!.actions[1]!.onPress()
    expect(pick).toHaveBeenCalledWith('commented')
  })
})

describe('postsTitle', () => {
  it('follows the chosen view', () => {
    expect((['mine', 'commented'] as const).map(postsTitle)).toEqual(['내가 쓴 글', '댓글 단 글'])
  })
})
