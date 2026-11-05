import { isValidElement, type ReactElement, type ReactNode } from 'react'
import { palette, radius, type } from '@/theme/tokens'

type El = ReactElement<Record<string, unknown>>

const compound = (name: string, parts: string[]) =>
  Object.assign(() => null, Object.fromEntries(parts.map((p) => [p, `${name}.${p}`])))

const modifier = (name: string) => (arg?: unknown) => ({ name, arg })
const modifiers = (names: string[]) => Object.fromEntries(names.map((n) => [n, modifier(n)]))

export const stubs = {
  reactNative: {
    Platform: { OS: 'ios' },
    View: 'View',
    Pressable: 'Pressable',
    Switch: 'RNSwitch',
    StyleSheet: { absoluteFill: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 } },
  },
  swiftUI: {
    Picker: 'Picker',
    Text: 'SText',
    Menu: 'SMenu',
    Button: 'SButton',
    RNHostView: 'RNHostView',
    DatePicker: 'SDatePicker',
    HStack: 'HStack',
    ContextMenu: compound('ContextMenu', ['Trigger', 'Items', 'Preview']),
  },
  swiftUIModifiers: modifiers(['pickerStyle', 'tag', 'controlSize', 'datePickerStyle', 'labelsHidden', 'accessibilityLabel']),
  compose: {
    Switch: 'CSwitch',
    Text: 'CText',
    Box: 'CBox',
    SingleChoiceSegmentedButtonRow: 'SegmentedRow',
    SegmentedButton: compound('SegmentedButton', ['Label']),
    DropdownMenu: compound('DropdownMenu', ['Trigger', 'Items']),
    DropdownMenuItem: compound('DropdownMenuItem', ['Text']),
    DatePickerDialog: 'DatePickerDialog',
    TimePickerDialog: 'TimePickerDialog',
  },
  composeModifiers: modifiers(['semantics', 'fillMaxWidth', 'fillMaxSize', 'weight']),
  theme: { palette, radius, type, useColors: () => palette.light, useThemeMode: () => 'light', fontFor: () => ({}) },
}

const children = (node: ReactNode): ReactNode[] => {
  if (Array.isArray(node)) return node.flatMap(children)
  if (!isValidElement(node)) return []
  const props = (node as El).props
  return [node, ...children(props.children as ReactNode), ...children(props.label as ReactNode)]
}

export const findAll = (tree: ReactNode, type: unknown) => children(tree).filter((n): n is El => isValidElement(n) && n.type === type)

export const find = (tree: ReactNode, type: unknown) => {
  const [first] = findAll(tree, type)
  if (!first) throw new Error(`no ${String(type)} in tree`)
  return first
}
