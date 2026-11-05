import { useState } from 'react'
import { Pressable } from 'react-native'
import type { MenuProps } from './menu-action'
import MenuAnchor from './menu-anchor'

/** Android: Material 3 dropdown menu on tap. */
const Menu = ({ actions, accessibilityLabel, children }: MenuProps) => {
  const [open, setOpen] = useState(false)
  return (
    <MenuAnchor actions={actions} open={open} onClose={() => setOpen(false)}>
      <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={() => setOpen(true)}>
        {children}
      </Pressable>
    </MenuAnchor>
  )
}

export default Menu
