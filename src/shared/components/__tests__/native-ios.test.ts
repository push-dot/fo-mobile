import { createElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { NATIVE_FONTS } from '@/theme/fonts'
import { type } from '@/theme/tokens'
import { find, findAll } from './native-stubs'

vi.mock('react-native', async () => (await import('./native-stubs')).stubs.reactNative)
vi.mock('@expo/ui', () => ({ Host: 'Host' }))
vi.mock('@expo/ui/swift-ui', async () => (await import('./native-stubs')).stubs.swiftUI)
vi.mock('@expo/ui/swift-ui/modifiers', async () => (await import('./native-stubs')).stubs.swiftUIModifiers)
vi.mock('@/theme', async () => (await import('./native-stubs')).stubs.theme)
vi.mock('@/shared/utility/asset-url', () => ({}))
const setSegmentedTitleFont = vi.hoisted(() => vi.fn())
vi.mock('../../../../modules/segmented-appearance', () => ({ setSegmentedTitleFont }))

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
  it('sets the 600 label face on every UISegmentedControl', () => {
    expect(setSegmentedTitleFont).toHaveBeenCalledWith(NATIVE_FONTS[type.segLabel.weight], type.segLabel.fontSize)
  })

  it('renders a SwiftUI segmented picker tagged by item key', () => {
    const onChange = vi.fn()
    const tree = SegmentedControl({ items: [{ key: 'a', label: '받은' }, { key: 'b', label: '보낸' }], value: 'a', onChange })
    const picker = find(tree, 'Picker')
    expect(picker.props.selection).toBe('a')
    expect(picker.props.modifiers).toContainEqual({ name: 'pickerStyle', arg: 'segmented' })
    expect(picker.props.modifiers).not.toContainEqual(expect.objectContaining({ name: 'tint' }))
    expect(findAll(tree, 'SText').map((t) => [t.props.children, t.props.modifiers])).toEqual([
      ['받은', [{ name: 'tag', arg: 'a' }]],
      ['보낸', [{ name: 'tag', arg: 'b' }]],
    ])
    ;(picker.props.onSelectionChange as (k: string) => void)('b')
    expect(onChange).toHaveBeenCalledWith('b')
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
    ;(buttons[1]!.props.onPress as () => void)()
    expect(actions[1]!.onPress).toHaveBeenCalled()
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
