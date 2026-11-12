import { describe, expect, it, vi } from 'vitest'
import { findAll } from './native-stubs'

vi.mock('react-native', () => ({ Platform: { OS: 'ios' }, Pressable: 'Pressable', View: 'View' }))
vi.mock('../../../theme', async () => {
  const tokens = await import('../../../theme/tokens')
  return { spacing: tokens.spacing, type: tokens.type }
})
vi.mock('../icon', () => ({ default: 'Icon' }))
vi.mock('../text', () => ({ default: 'Text' }))

const { default: SettingsRow } = await import('../settings-row')

const labelOf = (tree: ReturnType<typeof SettingsRow>) => findAll(tree, 'Text')[0]?.props

describe('SettingsRow', () => {
  it('draws 차단한 사람 in the accent colour and bold', () => {
    const props = labelOf(
      SettingsRow({ label: '차단한 사람', value: '2명', accent: true, onPress: vi.fn() }),
    )
    expect(props).toMatchObject({ children: '차단한 사람', color: 'acText', weight: '700' })
  })

  it('leaves an ordinary label in the primary colour', () => {
    const props = labelOf(SettingsRow({ label: '커리어 상태', onPress: vi.fn() }))
    expect(props).toMatchObject({ children: '커리어 상태', color: 't1' })
    expect(props?.weight).toBeUndefined()
  })

  it('draws the chevron in t3 beside a value and in t1 on its own, as Settings does', () => {
    const chevron = (props: Parameters<typeof SettingsRow>[0]) => findAll(SettingsRow(props), 'Icon')[0]?.props
    expect(chevron({ label: '커리어 상태', value: '모두에게', onPress: vi.fn() })).toMatchObject({ name: 'chev', size: 16, color: 't3' })
    expect(chevron({ label: '고객센터', onPress: vi.fn() })).toMatchObject({ name: 'chev', size: 16, color: 't1' })
  })
})
