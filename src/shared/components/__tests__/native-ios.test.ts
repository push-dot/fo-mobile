import { createElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { palette } from '@/theme/tokens'
import { find, findAll } from './native-stubs'

vi.mock('react-native', async () => (await import('./native-stubs')).stubs.reactNative)
vi.mock('@expo/ui', () => ({ Host: 'Host' }))
vi.mock('@expo/ui/swift-ui', async () => (await import('./native-stubs')).stubs.swiftUI)
vi.mock('@expo/ui/swift-ui/modifiers', async () => (await import('./native-stubs')).stubs.swiftUIModifiers)
vi.mock('@/theme', async () => (await import('./native-stubs')).stubs.theme)
vi.mock('@/shared/utility/asset-url', () => ({}))
vi.mock('../glass', () => ({ default: 'Glass' }))
vi.mock('../text', () => ({ default: 'Text' }))

const { default: SegmentedControl } = await import('../segmented-control.ios')
const { default: MenuButtons } = await import('../menu-buttons')
const { default: Menu } = await import('../menu.ios')
const { default: ContextMenu } = await import('../context-menu.ios')
const { default: DatePicker } = await import('../date-picker.ios')

const actions = [
  { key: 'share', label: '공유하기', systemImage: 'square.and.arrow.up' as const, onPress: vi.fn() },
  { key: 'delete', label: '삭제하기', destructive: true, onPress: vi.fn() },
  { key: 'latest', label: '최신순', selected: true, onPress: vi.fn() },
]

describe('SegmentedControl (iOS)', () => {
  const items = [
    { key: 'received', label: '받은 제안 4' },
    { key: 'sent', label: '보낸 제안 3' },
  ]
  const segments = (tree: ReturnType<typeof SegmentedControl>) => findAll(tree, 'Pressable')

  it('draws the boards\' .ios .seg: a 44pt glass track whose selected segment is filled', () => {
    const tree = SegmentedControl({ items, value: 'received', onChange: vi.fn() })
    expect(find(tree, 'Glass').props.style).toMatchObject({ height: 44, borderRadius: 22 })
    const style = (s: { props: Record<string, unknown> }) => s.props.style as { backgroundColor?: string; boxShadow?: string }
    expect(find(tree, 'View').props.accessibilityRole).toBe('tablist')
    expect(segments(tree).map((s) => [s.props.accessibilityRole, s.props.accessibilityState, style(s).backgroundColor, style(s).boxShadow])).toEqual([
      ['tab', { selected: true }, palette.light.fill, '0 2px 8px rgba(0,0,0,.08)'],
      ['tab', { selected: false }, undefined, undefined],
    ])
    expect(findAll(tree, 'Text').map((t) => [t.props.children, t.props.v, t.props.color])).toEqual([
      ['받은 제안 4', 'segLabel', 't1'],
      ['보낸 제안 3', 'segLabel', 't3'],
    ])
  })

  it('reports the pressed segment', () => {
    const onChange = vi.fn()
    const [, sent] = segments(SegmentedControl({ items, value: 'received', onChange }))
    ;(sent!.props.onPress as () => void)()
    expect(onChange).toHaveBeenCalledWith('sent')
  })

  it('draws the 196 x 34 compact control of the theme row as a radio group, as Settings marks it', () => {
    const tree = SegmentedControl({ items, value: 'sent', onChange: vi.fn(), compact: true })
    expect(find(tree, 'Glass').props.style).toMatchObject({ width: 196, height: 34, borderRadius: 17 })
    expect(find(tree, 'View').props.accessibilityRole).toBe('radiogroup')
    expect(segments(tree).map((s) => [s.props.accessibilityRole, s.props.accessibilityState])).toEqual([
      ['radio', { checked: false }],
      ['radio', { checked: true }],
    ])
  })
})

describe('menu items (iOS)', () => {
  it('maps actions to UIMenu buttons with role and check mark', () => {
    const buttons = findAll(MenuButtons({ actions }), 'SButton')
    expect(buttons.map((b) => [b.props.label, b.props.systemImage, b.props.role])).toEqual([
      ['공유하기', 'square.and.arrow.up', undefined],
      ['삭제하기', undefined, 'destructive'],
      ['최신순', 'checkmark', undefined],
    ])
    // The host tint (t1) would paint the destructive icon too; the boards draw it red like the label.
    expect(buttons.map((b) => b.props.modifiers)).toEqual([undefined, [{ name: 'tint', arg: palette.light.red }], undefined])
    ;(buttons[1]!.props.onPress as () => void)()
    expect(actions[1]!.onPress).toHaveBeenCalled()
  })
})

describe('menu sections (iOS)', () => {
  it('wraps each section in a titled UIMenu section', () => {
    const tree = MenuButtons({ actions: [{ key: 'view', title: '보기', actions: [actions[2]!] }, { key: 'more', actions: [actions[0]!] }] })
    expect(findAll(tree, 'SSection').map((s) => s.props.title)).toEqual(['보기', undefined])
    expect(findAll(tree, 'SButton').map((b) => b.props.label)).toEqual(['최신순', '공유하기'])
  })
})

describe('Menu (iOS)', () => {
  it('opens a pull-down menu from the React Native trigger', () => {
    const trigger = createElement('View')
    const tree = Menu({ actions, accessibilityLabel: '정렬', children: trigger })
    const menu = find(tree, 'SMenu')
    expect(menu.props.modifiers).toContainEqual({ name: 'accessibilityLabel', arg: '정렬' })
    expect(find(menu.props.label as never, 'RNHostView').props.children).toBe(trigger)
    expect(find(tree, MenuButtons).props.actions).toBe(actions)
  })
})

describe('ContextMenu (iOS)', () => {
  it('keeps tap on the row and adds the long-press menu with a preview', () => {
    const onPress = vi.fn()
    const preview = createElement('View', { testID: 'preview' })
    const tree = ContextMenu({ actions, onPress, accessibilityLabel: '대화', preview, children: createElement('View') })
    const row = find(find(tree, 'ContextMenu.Trigger'), 'Pressable')
    expect(row.props.onPress).toBe(onPress)
    expect(row.props.accessibilityLabel).toBe('대화')
    expect(find(find(tree, 'ContextMenu.Items'), MenuButtons).props.actions).toBe(actions)
    expect(find(find(tree, 'ContextMenu.Preview'), 'RNHostView').props.children).toBe(preview)
  })

  it('leaves the preview to the system when none is given', () => {
    const tree = ContextMenu({ actions, accessibilityLabel: '대화', children: createElement('View') })
    expect(findAll(tree, 'ContextMenu.Preview')).toEqual([])
  })
})

describe('DatePicker (iOS)', () => {
  it('uses the compact SwiftUI date picker for days', () => {
    const onChange = vi.fn()
    const value = new Date(2026, 9, 23)
    const min = new Date(2026, 0, 1)
    const picker = find(DatePicker({ value, onChange, label: '날짜', min }), 'SDatePicker')
    expect(picker.props).toMatchObject({ selection: value, displayedComponents: ['date'], range: { start: min, end: undefined } })
    expect(picker.props.modifiers).toEqual(
      expect.arrayContaining([{ name: 'datePickerStyle', arg: 'compact' }, { name: 'labelsHidden', arg: undefined }, { name: 'accessibilityLabel', arg: '날짜' }]),
    )
    const picked = new Date(2026, 9, 30)
    ;(picker.props.onDateChange as (d: Date) => void)(picked)
    expect(onChange).toHaveBeenCalledWith(picked)
  })

  it('shows only hour and minute in time mode', () => {
    const picker = find(DatePicker({ value: new Date(), onChange: vi.fn(), label: '시간', mode: 'time' }), 'SDatePicker')
    expect(picker.props.displayedComponents).toEqual(['hourAndMinute'])
  })

  it('picks a month with year and month menus', () => {
    const onChange = vi.fn()
    const tree = DatePicker({ value: new Date(2022, 2, 1), onChange, label: '시작', mode: 'month', min: new Date(2020, 0, 1), max: new Date(2023, 5, 10) })
    const [year, month] = findAll(tree, Menu)
    expect(JSON.stringify(year!.props.children)).toContain('2022년')
    expect(JSON.stringify(month!.props.children)).toContain('3월')
    const years = year!.props.actions as { label: string; selected?: boolean; onPress: () => void }[]
    expect(years.map((y) => y.label)).toEqual(['2023년', '2022년', '2021년', '2020년'])
    expect(years.find((y) => y.selected)?.label).toBe('2022년')
    years[3]!.onPress()
    expect(onChange).toHaveBeenLastCalledWith(new Date(2020, 2, 1))
  })

  it('shows the label until a year is picked when no month is set', () => {
    const onChange = vi.fn()
    const tree = DatePicker({ value: null, onChange, label: '종료', mode: 'month', min: new Date(2020, 0, 1), max: new Date(2021, 5, 1) })
    expect(findAll(tree, 'Picker')).toEqual([])
    const menu = find(tree, Menu)
    expect(JSON.stringify(menu.props.children)).toContain('종료')
    const years = menu.props.actions as { label: string; onPress: () => void }[]
    expect(years.map((y) => y.label)).toEqual(['2021년', '2020년'])
    years[1]!.onPress()
    expect((onChange.mock.calls[0]![0] as Date).getFullYear()).toBe(2020)
  })

  it('keeps a picked month inside the allowed range', () => {
    const onChange = vi.fn()
    const tree = DatePicker({ value: new Date(2023, 2, 1), onChange, label: '종료', mode: 'month', max: new Date(2023, 5, 10) })
    const months = findAll(tree, Menu)[1]!.props.actions as { label: string; onPress: () => void }[]
    months.find((m) => m.label === '12월')!.onPress()
    expect(onChange).toHaveBeenLastCalledWith(new Date(2023, 5, 1))
  })
})
