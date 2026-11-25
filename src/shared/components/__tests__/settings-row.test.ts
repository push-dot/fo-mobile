import { describe, expect, it, vi } from 'vitest'
import { findAll, flat } from './native-stubs'

vi.mock('react-native', () => ({ Platform: { OS: 'ios' }, Pressable: 'Pressable', View: 'View' }))
vi.mock('../../../theme', async () => {
  const tokens = await import('../../../theme/tokens')
  return { largeType: tokens.largeType, spacing: tokens.spacing, type: tokens.type }
})
vi.mock('../icon', () => ({ default: 'Icon' }))
vi.mock('../text', () => ({ default: 'Text' }))

const { default: SettingsRow } = await import('../settings-row')

const labelOf = (tree: ReturnType<typeof SettingsRow>) => findAll(tree, 'Text')[0]?.props

describe('SettingsRow', () => {
  it('draws 차단한 사람 plain: t1, regular, no fill (note 299)', () => {
    const tree = SettingsRow({ label: '차단한 사람', value: '2명', onPress: vi.fn() })
    expect(labelOf(tree)).toMatchObject({ color: 't1' })
    expect(labelOf(tree)?.weight).toBeUndefined()
    expect((flat(findAll(tree, 'View')[0]?.props.style) as { backgroundColor?: string }).backgroundColor).toBeUndefined()
  })

  it('leaves an ordinary label in the primary colour', () => {
    const props = labelOf(SettingsRow({ label: '커리어 상태', onPress: vi.fn() }))
    expect(props).toMatchObject({ children: '커리어 상태', color: 't1' })
    expect(props?.weight).toBeUndefined()
  })

  it('draws the chevron in t3 only for rows whose board value sits in .v, otherwise in the label colour t1', () => {
    const chevron = (props: Parameters<typeof SettingsRow>[0]) => findAll(SettingsRow(props), 'Icon')[0]?.props
    expect(chevron({ label: '커리어 상태', onPress: vi.fn(), mutedChevron: true })).toMatchObject({ name: 'chev', size: 16, color: 't3' })
    expect(chevron({ label: '차단한 사람', onPress: vi.fn(), mutedChevron: true })).toMatchObject({ color: 't3' })
    expect(chevron({ label: '고객센터', onPress: vi.fn() })).toMatchObject({ color: 't1' })
    expect(chevron({ label: '약관 및 정책', onPress: vi.fn() })).toMatchObject({ color: 't1' })
    expect(chevron({ label: '이력서', value: '3개', onPress: vi.fn() })).toMatchObject({ color: 't3' })
  })

  it('draws the BotProfileXL row at XL_ROW_HEIGHT with a 21 pt label and an 18 pt value', () => {
    const tree = SettingsRow({ label: '공고', value: '11월 20일 마감', onPress: vi.fn(), xl: true })
    expect((flat(findAll(tree, 'View')[0]?.props.style) as { minHeight: number }).minHeight).toBe(80)
    expect(findAll(tree, 'Text')[0]?.props).toMatchObject({ allowFontScaling: false, style: { fontSize: 21, lineHeight: 28 } })
    expect(findAll(tree, 'Text')[1]?.props).toMatchObject({ allowFontScaling: false, style: { fontSize: 18 } })
  })
})
