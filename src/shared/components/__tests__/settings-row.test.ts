import { describe, expect, it, vi } from 'vitest'
import { findAll } from './native-stubs'

vi.mock('react-native', () => ({ Platform: { OS: 'ios' }, Pressable: 'Pressable', View: 'View' }))
vi.mock('../../../theme', async () => {
  const tokens = await import('../../../theme/tokens')
  return { spacing: tokens.spacing, type: tokens.type, useColors: () => ({ acSoft: '#acsoft' }) }
})
vi.mock('../icon', () => ({ default: 'Icon' }))
vi.mock('../text', () => ({ default: 'Text' }))

const { default: SettingsRow } = await import('../settings-row')

const labelOf = (tree: ReturnType<typeof SettingsRow>) => findAll(tree, 'Text')[0]?.props

describe('SettingsRow', () => {
  it('draws the entry state as an acSoft row with a bold t1 label', () => {
    const tree = SettingsRow({ label: '차단한 사람', value: '2명', entry: true, onPress: vi.fn() })
    expect(labelOf(tree)).toMatchObject({ children: '차단한 사람', color: 't1', weight: '700' })
    expect(findAll(tree, 'View')[0]?.props.style).toMatchObject({ backgroundColor: '#acsoft' })
  })

  it('draws 차단한 사람 plain (t1, regular, no fill) when it is not the entry', () => {
    const tree = SettingsRow({ label: '차단한 사람', value: '2명', onPress: vi.fn() })
    expect(labelOf(tree)).toMatchObject({ color: 't1' })
    expect(labelOf(tree)?.weight).toBeUndefined()
    expect((findAll(tree, 'View')[0]?.props.style as { backgroundColor?: string }).backgroundColor).toBeUndefined()
  })

  it('leaves an ordinary label in the primary colour', () => {
    const props = labelOf(SettingsRow({ label: '커리어 상태', onPress: vi.fn() }))
    expect(props).toMatchObject({ children: '커리어 상태', color: 't1' })
    expect(props?.weight).toBeUndefined()
  })

  it('draws the chevron in t3 (the board .grp .it .v) with or without a value, also on the entry row', () => {
    const chevron = (props: Parameters<typeof SettingsRow>[0]) => findAll(SettingsRow(props), 'Icon')[0]?.props
    expect(chevron({ label: '커리어 상태', value: '모두에게', onPress: vi.fn() })).toMatchObject({ name: 'chev', size: 16, color: 't3' })
    expect(chevron({ label: '고객센터', onPress: vi.fn() })).toMatchObject({ name: 'chev', size: 16, color: 't3' })
    expect(chevron({ label: '차단한 사람', entry: true, onPress: vi.fn() })).toMatchObject({ color: 't3' })
  })
})
