import type { ButtonProps } from '@expo/ui/swift-ui'
import type { IconName } from '@push/design-system'
import type { ReactElement } from 'react'
import type { AppIconName } from './icon'
import type { PressableProps } from 'react-native'

export type MenuAction = {
  key: string
  label: string
  onPress: () => void
  systemImage?: ButtonProps['systemImage']
  icon?: IconName | AppIconName
  destructive?: boolean
  selected?: boolean
}

export type MenuSection = { key: string; title?: string; actions: MenuAction[]; check?: 'trailing' }

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
  stretch?: boolean
  hitSlop?: PressableProps['hitSlop']
}

export type ContextMenuProps = MenuProps & { onPress?: () => void; preview?: ReactElement }
