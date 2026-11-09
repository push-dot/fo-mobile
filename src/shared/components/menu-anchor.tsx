import { Box, DropdownMenu, DropdownMenuItem, HorizontalDivider, RNHostView, Text as ComposeText } from '@expo/ui/jetpack-compose'
import { Fragment } from 'react'
import { fillMaxSize, selectable } from '@expo/ui/jetpack-compose/modifiers'
import { StyleSheet, View } from 'react-native'
import { radius, spacing, useColors } from '../../theme'
import Icon from './icon'
import { menuSections, type MenuAction, type MenuSection } from './menu-action'
import NativeHost from './native-host'
import Text from './text'

const ICON_SIZE = 20
const CHECK_SIZE = 18

type Props = { actions: MenuAction[] | MenuSection[]; open: boolean; onClose: () => void; children: React.ReactElement }

/** Android: Material 3 dropdown anchored over its trigger; the overlay passes touches to the trigger. */
const MenuAnchor = ({ actions, open, onClose, children }: Props) => {
  const c = useColors()
  const sections = menuSections(actions)
  return (
    <View>
      {children}
      <NativeHost pointerEvents="none" style={StyleSheet.absoluteFill}>
        <DropdownMenu expanded={open} onDismissRequest={onClose} color={c.card} cornerRadius={radius.lg}>
          <DropdownMenu.Trigger>
            <Box modifiers={[fillMaxSize()]} />
          </DropdownMenu.Trigger>
          <DropdownMenu.Items>
            {sections.map((s, si) => (
              <Fragment key={s.key}>
                {si > 0 ? <HorizontalDivider color={c.line} /> : null}
                {s.title ? (
                  <RNHostView matchContents>
                    <Text
                      v="c2"
                      weight="700"
                      color="t3"
                      accessibilityRole="header"
                      style={{ paddingHorizontal: spacing[3], paddingTop: spacing[2], paddingBottom: spacing[1] }}
                    >
                      {s.title}
                    </Text>
                  </RNHostView>
                ) : null}
                {s.actions.map((a, i) => {
                  const ink = a.destructive ? c.red : c.t1
                  const trailing = s.check === 'trailing'
                  const choice = !trailing && s.actions.some((x) => x.selected !== undefined)
                  const pick = () => (onClose(), a.onPress())
                  return (
                    <Fragment key={a.key}>
                      {sections.length === 1 && a.destructive && i > 0 && !s.actions[i - 1]!.destructive ? <HorizontalDivider color={c.line} /> : null}
                      <DropdownMenuItem
                        onClick={pick}
                        elementColors={{ textColor: ink }}
                        modifiers={choice ? [selectable(!!a.selected, pick, 'radioButton')] : undefined}
                      >
                        {a.icon || choice ? (
                          <DropdownMenuItem.LeadingIcon>
                            <RNHostView matchContents>
                              {a.icon ? (
                                <Icon name={a.icon} size={ICON_SIZE} color={ink} />
                              ) : a.selected ? (
                                <Icon name="check" size={CHECK_SIZE} color="t1" />
                              ) : (
                                <View style={{ width: CHECK_SIZE, height: CHECK_SIZE }} />
                              )}
                            </RNHostView>
                          </DropdownMenuItem.LeadingIcon>
                        ) : null}
                        <DropdownMenuItem.Text>
                          <ComposeText style={trailing && a.selected ? { fontWeight: 'bold' } : undefined}>{a.label}</ComposeText>
                        </DropdownMenuItem.Text>
                        {trailing && a.selected ? (
                          <DropdownMenuItem.TrailingIcon>
                            <RNHostView matchContents>
                              <Icon name="check" size={CHECK_SIZE} color="acText" />
                            </RNHostView>
                          </DropdownMenuItem.TrailingIcon>
                        ) : null}
                      </DropdownMenuItem>
                    </Fragment>
                  )
                })}
              </Fragment>
            ))}
          </DropdownMenu.Items>
        </DropdownMenu>
      </NativeHost>
    </View>
  )
}

export default MenuAnchor
