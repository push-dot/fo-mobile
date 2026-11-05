import { Box, DropdownMenu, DropdownMenuItem, HorizontalDivider, RNHostView, Text } from '@expo/ui/jetpack-compose'
import { Fragment } from 'react'
import { fillMaxSize } from '@expo/ui/jetpack-compose/modifiers'
import { StyleSheet, View } from 'react-native'
import { radius, useColors } from '../../theme'
import Icon from './icon'
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
        <DropdownMenu expanded={open} onDismissRequest={onClose} color={c.card} cornerRadius={radius.lg}>
          <DropdownMenu.Trigger>
            <Box modifiers={[fillMaxSize()]} />
          </DropdownMenu.Trigger>
          <DropdownMenu.Items>
            {actions.map((a, i) => {
              const ink = a.destructive ? c.red : a.selected ? c.acText : c.t1
              return (
                <Fragment key={a.key}>
                  {a.destructive && i > 0 && !actions[i - 1].destructive ? <HorizontalDivider color={c.line} /> : null}
                  <DropdownMenuItem onClick={() => (onClose(), a.onPress())} elementColors={{ textColor: ink }}>
                    {a.icon ? (
                      <DropdownMenuItem.LeadingIcon>
                        <RNHostView matchContents>
                          <Icon name={a.icon} size={20} color={ink} />
                        </RNHostView>
                      </DropdownMenuItem.LeadingIcon>
                    ) : null}
                    <DropdownMenuItem.Text>
                      <Text>{a.label}</Text>
                    </DropdownMenuItem.Text>
                  </DropdownMenuItem>
                </Fragment>
              )
            })}
          </DropdownMenu.Items>
        </DropdownMenu>
      </NativeHost>
    </View>
  )
}

export default MenuAnchor
