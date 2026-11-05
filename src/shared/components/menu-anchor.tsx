import { Box, DropdownMenu, DropdownMenuItem, Text } from '@expo/ui/jetpack-compose'
import { fillMaxSize } from '@expo/ui/jetpack-compose/modifiers'
import { StyleSheet, View } from 'react-native'
import { useColors } from '../../theme'
import type { MenuAction } from './menu-action'
import NativeHost from './native-host'

type Props = { actions: MenuAction[]; open: boolean; onClose: () => void; children: React.ReactElement }

/** Android: Material 3 dropdown anchored over its trigger; the overlay passes touches to the trigger. */
const MenuAnchor = ({ actions, open, onClose, children }: Props) => {
  const c = useColors()
  return (
    <View>
      {children}
      <NativeHost pointerEvents="none" style={StyleSheet.absoluteFill}>
        <DropdownMenu expanded={open} onDismissRequest={onClose} color={c.card}>
          <DropdownMenu.Trigger>
            <Box modifiers={[fillMaxSize()]} />
          </DropdownMenu.Trigger>
          <DropdownMenu.Items>
            {actions.map((a) => (
              <DropdownMenuItem
                key={a.key}
                onClick={() => (onClose(), a.onPress())}
                elementColors={{ textColor: a.destructive ? c.red : a.selected ? c.acText : c.t1 }}
              >
                <DropdownMenuItem.Text>
                  <Text>{a.label}</Text>
                </DropdownMenuItem.Text>
              </DropdownMenuItem>
            ))}
          </DropdownMenu.Items>
        </DropdownMenu>
      </NativeHost>
    </View>
  )
}

export default MenuAnchor
