import { useState } from 'react'
import { Pressable } from 'react-native'
import type { ContextMenuProps } from './menu-action'
import MenuAnchor from './menu-anchor'

const ContextMenu = ({ actions, accessibilityLabel, onPress, children }: ContextMenuProps) => {
  const [open, setOpen] = useState(false)
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress} onLongPress={() => setOpen(true)}>
      <MenuAnchor actions={actions} open={open} onClose={() => setOpen(false)}>
        {children}
      </MenuAnchor>
    </Pressable>
  )
}

export default ContextMenu
