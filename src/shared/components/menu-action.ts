import type { ButtonProps } from '@expo/ui/swift-ui'
import type { IconName } from '@push/design-system'
import type { ReactElement } from 'react'
import type { AppIconName } from './icon'
import type { PressableProps } from 'react-native'

export type MenuAction = {
  key: string
  label: string
  onPress: () => void
  /** SF Symbol shown on iOS only. */
  systemImage?: ButtonProps['systemImage']
  /** Design icon shown on Android only (Material leading icon). */
  icon?: IconName | AppIconName
  destructive?: boolean
  selected?: boolean
}

export type MenuSection = { key: string; title?: string; actions: MenuAction[]; /** Android: the pick reads as a bold label with a trailing check (MyPostsAllMenu) instead of the leading check. */ check?: 'trailing' }

/** A flat list draws its destructive tail (삭제, 대화 지우기) below a divider, as the boards do: it becomes its own section. */
const flatSections = (actions: MenuAction[]): MenuSection[] => {
  const at = actions.findIndex((a, i) => i > 0 && a.destructive && !actions[i - 1]!.destructive)
  return at < 0 ? [{ key: 'actions', actions }] : [{ key: 'actions', actions: actions.slice(0, at) }, { key: 'destructive', actions: actions.slice(at) }]
}

export const menuSections = (items: MenuAction[] | MenuSection[]): MenuSection[] =>
  items.length && 'actions' in items[0]! ? (items as MenuSection[]) : flatSections(items as MenuAction[])

export type MenuProps = {
  actions: MenuAction[] | MenuSection[]
  accessibilityLabel: string
  children: ReactElement
  /** iOS: the trigger takes the parent's width (a full settings row) instead of its own. */
  stretch?: boolean
  /** Android: grows a small trigger's touch area without growing the row. iOS: the UIMenu owns the tap and ignores it. */
  hitSlop?: PressableProps['hitSlop']
}

export type ContextMenuProps = MenuProps & { onPress?: () => void; preview?: ReactElement }
