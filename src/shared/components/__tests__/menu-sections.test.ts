import { describe, expect, it } from 'vitest'
import { menuSections } from '../menu-action'

const a = (key: string) => ({ key, label: key, onPress: () => {} })

describe('menuSections', () => {
  it('keeps a flat action list as one untitled section', () => {
    const flat = [a('x'), a('y')]
    expect(menuSections(flat)).toEqual([{ key: 'actions', actions: flat }])
  })

  it('passes sections through in order, keeping each section its own actions', () => {
    const sections = [{ key: 'view', title: '보기', actions: [a('mine'), a('commented')] }, { key: 'sort', title: '정렬', actions: [a('latest')] }]
    expect(menuSections(sections).map((s) => [s.title, s.actions.map((x) => x.key)])).toEqual([['보기', ['mine', 'commented']], ['정렬', ['latest']]])
  })

  it('treats an empty list as one empty section', () => {
    expect(menuSections([])).toEqual([{ key: 'actions', actions: [] }])
  })
})

describe('menuSections destructive tail', () => {
  const d = (key: string) => ({ ...a(key), destructive: true })

  it('puts a destructive tail in its own section, so both platforms draw the divider', () => {
    const s = menuSections([a('profile'), a('find'), d('delete')])
    expect(s.map((x) => x.actions.map((y) => y.key))).toEqual([['profile', 'find'], ['delete']])
  })

  it('does not split a list with no destructive item or a destructive first item', () => {
    expect(menuSections([a('x'), a('y')])).toHaveLength(1)
    expect(menuSections([d('x'), a('y')])).toHaveLength(1)
  })
})
