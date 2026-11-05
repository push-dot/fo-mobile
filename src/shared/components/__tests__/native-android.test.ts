import { createElement } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { palette } from '@/theme/tokens'
import { toPickerUtc } from '@/shared/utility/picker-date'
import { find, findAll, stubs } from './native-stubs'

const state = vi.hoisted(() => ({ value: undefined as unknown, set: (() => {}) as (v: unknown) => void }))
vi.mock('react', async (orig) => ({ ...(await orig<typeof import('react')>()), useState: (init: unknown) => [state.value ?? init, state.set] }))
vi.mock('react-native', async () => ({ ...(await import('./native-stubs')).stubs.reactNative, Platform: { OS: 'android' } }))
vi.mock('@expo/ui', () => ({ Host: 'Host' }))
vi.mock('@expo/ui/jetpack-compose', async () => (await import('./native-stubs')).stubs.compose)
vi.mock('@expo/ui/jetpack-compose/modifiers', async () => (await import('./native-stubs')).stubs.composeModifiers)
vi.mock('@/theme', async () => (await import('./native-stubs')).stubs.theme)
vi.mock('@/shared/utility/asset-url', () => ({}))
vi.mock('@/shared/components/icon', () => ({ default: 'Icon' }))
vi.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }) }))
vi.mock('../button', () => ({ default: 'Button' }))
vi.mock('../text', () => ({ default: 'Text' }))

const { default: Switch } = await import('../switch.android')
const { default: SegmentedControl } = await import('../segmented-control.android')
const { default: MenuAnchor } = await import('../menu-anchor')
const { default: NativeHost } = await import('../native-host')
const { default: Menu } = await import('../menu.android')
const { default: ContextMenu } = await import('../context-menu.android')
const { default: DatePicker } = await import('../date-picker.android')
const { default: Sheet } = await import('../sheet')

const c = palette.light
const actions = [
  { key: 'share', label: '공유하기', onPress: vi.fn() },
  { key: 'delete', label: '삭제하기', destructive: true, onPress: vi.fn() },
  { key: 'latest', label: '최신순', selected: true, onPress: vi.fn() },
]

beforeEach(() => {
  state.value = undefined
  state.set = vi.fn()
})

describe('Switch (Android)', () => {
  it('renders a Material 3 switch in theme colors with a TalkBack label', () => {
    const onValueChange = vi.fn()
    const sw = find(Switch({ value: true, onValueChange, label: '제안 받기' }), 'CSwitch')
    expect(sw.props.value).toBe(true)
    expect(sw.props.colors).toMatchObject({ checkedTrackColor: c.ac, uncheckedTrackColor: c.fill2 })
    expect(sw.props.modifiers).toContainEqual({ name: 'semantics', arg: { contentDescription: '제안 받기' } })
    ;(sw.props.onCheckedChange as (v: boolean) => void)(false)
    expect(onValueChange).toHaveBeenCalledWith(false)
  })
})

describe('SegmentedControl (Android)', () => {
  it('renders Material segmented buttons and reports the picked key', () => {
    const onChange = vi.fn()
    const tree = SegmentedControl({ items: [{ key: 'a', label: '받은' }, { key: 'b', label: '보낸' }], value: 'b', onChange })
    const buttons = findAll(find(tree, 'SegmentedRow'), stubs.compose.SegmentedButton)
    expect(buttons.map((b) => b.props.selected)).toEqual([false, true])
    expect(findAll(tree, 'CText').map((t) => t.props.children)).toEqual(['받은', '보낸'])
    expect(buttons[0]!.props.colors).toMatchObject({
      activeContainerColor: c.bg,
      activeContentColor: c.t1,
      inactiveContainerColor: c.fill,
      inactiveContentColor: c.t3,
    })
    ;(buttons[0]!.props.onClick as () => void)()
    expect(onChange).toHaveBeenCalledWith('a')
  })
})

describe('MenuAnchor (Android)', () => {
  it('anchors a Material dropdown over the trigger without taking its touches', () => {
    const onClose = vi.fn()
    const tree = MenuAnchor({ actions, open: true, onClose, children: createElement('View') })
    expect(find(tree, NativeHost).props.pointerEvents).toBe('none')
    const menu = findAll(tree, stubs.compose.DropdownMenu)[0]!
    expect(menu.props).toMatchObject({ expanded: true, onDismissRequest: onClose })
  })

  it('closes and runs the action when an item is picked, coloring delete and the current pick', () => {
    const onClose = vi.fn()
    const items = findAll(MenuAnchor({ actions, open: true, onClose, children: createElement('View') }), stubs.compose.DropdownMenuItem)
    expect(items.map((i) => (i.props.elementColors as { textColor: string }).textColor)).toEqual([c.t1, c.red, c.acText])
    ;(items[1]!.props.onClick as () => void)()
    expect(onClose).toHaveBeenCalled()
    expect(actions[1]!.onPress).toHaveBeenCalled()
  })

  it('separates the destructive item and draws a design icon as the leading icon', () => {
    const withIcon = [{ ...actions[0]!, icon: 'share' as const }, actions[1]!]
    const tree = MenuAnchor({ actions: withIcon, open: true, onClose: vi.fn(), children: createElement('View') })
    expect(findAll(tree, stubs.compose.HorizontalDivider)).toHaveLength(1)
    expect(findAll(tree, stubs.compose.DropdownMenuItem.LeadingIcon)).toHaveLength(1)
  })
})

describe('Menu and ContextMenu (Android)', () => {
  it('Menu opens on tap', () => {
    const anchor = Menu({ actions, accessibilityLabel: '정렬', children: createElement('View') })
    const trigger = find(anchor, 'Pressable')
    expect(trigger.props).toMatchObject({ accessibilityRole: 'button', accessibilityLabel: '정렬' })
    ;(trigger.props.onPress as () => void)()
    expect(state.set).toHaveBeenCalledWith(true)
  })

  it('ContextMenu keeps tap for the row and opens on long press', () => {
    const onPress = vi.fn()
    const row = find(ContextMenu({ actions, onPress, accessibilityLabel: '대화', children: createElement('View') }), 'Pressable')
    expect(row.props.onPress).toBe(onPress)
    ;(row.props.onLongPress as () => void)()
    expect(state.set).toHaveBeenCalledWith(true)
  })
})

describe('Sheet (Android)', () => {
  it('paints the drag handle with deco, the colour the canvas keeps for a grabber', () => {
    const handle = findAll(Sheet({ children: '본문' }), 'View').find((view) => {
      const style = view.props.style as { backgroundColor?: string } | undefined
      return style?.backgroundColor != null
    })
    expect(handle?.props.style).toMatchObject({ backgroundColor: c.deco })
    expect(c.deco).not.toBe(c.t4)
  })
})

describe('DatePicker (Android)', () => {
  it('shows the label as a placeholder and opens the Material dialog on tap', () => {
    const tree = DatePicker({ value: null, onChange: vi.fn(), label: '시작 날짜', mode: 'month' })
    expect(findAll(tree, 'DatePickerDialog')).toEqual([])
    expect(JSON.stringify(tree)).toContain('시작 날짜')
    ;(find(tree, 'Pressable').props.onPress as () => void)()
    expect(state.set).toHaveBeenCalledWith(true)
  })

  it('shows the picked month as text', () => {
    expect(JSON.stringify(DatePicker({ value: new Date(2022, 2, 1), onChange: vi.fn(), label: '시작', mode: 'month' }))).toContain('2022년 3월')
  })

  it('round-trips the day through Material UTC and trims month values', () => {
    state.value = true
    const onChange = vi.fn()
    const value = new Date(2022, 2, 1)
    const dialog = find(DatePicker({ value, onChange, label: '시작', mode: 'month' }), 'DatePickerDialog')
    expect(dialog.props.initialDate).toBe(toPickerUtc(value))
    ;(dialog.props.onDateSelected as (d: Date) => void)(new Date(Date.UTC(2021, 6, 19)))
    expect(onChange).toHaveBeenCalledWith(new Date(2021, 6, 1))
    expect(state.set).toHaveBeenCalledWith(false)
  })

  it('keeps the day and takes the picked time in time mode', () => {
    state.value = true
    const onChange = vi.fn()
    const dialog = find(DatePicker({ value: new Date(2026, 9, 23, 9, 0), onChange, label: '시간', mode: 'time' }), 'TimePickerDialog')
    ;(dialog.props.onDateSelected as (d: Date) => void)(new Date(2000, 0, 1, 14, 30))
    expect(onChange).toHaveBeenCalledWith(new Date(2026, 9, 23, 14, 30))
  })
})
