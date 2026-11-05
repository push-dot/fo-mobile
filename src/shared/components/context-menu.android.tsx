import { useState } from 'react'
import { Pressable } from 'react-native'
import type { ContextMenuProps } from './menu-action'
import MenuAnchor from './menu-anchor'

/** Android: Material 3 dropdown on long press (no preview on Android). Tap still runs onPress. */
const ContextMenu = ({ actions, accessibilityLabel, onPress, children }: ContextMenuProps) => {
  const [open, setOpen] = useState(false)
  return (
    <MenuAnchor actions={actions} open={open} onClose={() => setOpen(false)}>
      <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress} onLongPress={() => setOpen(true)}>
        {children}
      </Pressable>
    </MenuAnchor>
  )
}

export default ContextMenu
