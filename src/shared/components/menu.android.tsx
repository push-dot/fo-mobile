import { useState } from 'react'
import { Pressable } from 'react-native'
import type { MenuProps } from './menu-action'
import MenuAnchor from './menu-anchor'

const Menu = ({ actions, accessibilityLabel, children, hitSlop }: MenuProps) => {
  const [open, setOpen] = useState(false)
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} hitSlop={hitSlop} onPress={() => setOpen(true)}>
      <MenuAnchor actions={actions} open={open} onClose={() => setOpen(false)}>
        {children}
      </MenuAnchor>
    </Pressable>
  )
}

export default Menu
