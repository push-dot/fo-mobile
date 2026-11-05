import type { ButtonProps } from '@expo/ui/swift-ui'
import type { ReactElement } from 'react'

export type MenuAction = {
  key: string
  label: string
  onPress: () => void
  /** SF Symbol shown on iOS only. */
  systemImage?: ButtonProps['systemImage']
  destructive?: boolean
  selected?: boolean
}

export type MenuProps = { actions: MenuAction[]; accessibilityLabel: string; children: ReactElement }

export type ContextMenuProps = MenuProps & { onPress?: () => void; preview?: ReactElement }
