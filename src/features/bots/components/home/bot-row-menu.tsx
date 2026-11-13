import { useRef, useState, type ReactElement } from 'react'
import { Modal, Platform, Pressable, StyleSheet, View, useWindowDimensions, type HostInstance } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Blur, Icon, Text, type MenuAction } from '@/shared/components'
import { radius, spacing, useColors, useShadow } from '../../../../theme'
import { popTop, POP } from './row-menu-layout'

type Held = { y: number; height: number }

/** The board's long-press menu: the row lifts off a blurred scrim and the actions sit in a card under it. */
const BotRowMenu = ({
  actions,
  accessibilityLabel,
  onPress,
  children,
}: {
  actions: MenuAction[]
  accessibilityLabel: string
  onPress: () => void
  children: ReactElement
}) => {
  const c = useColors()
  const shadow = useShadow()
  const insets = useSafeAreaInsets()
  const screen = useWindowDimensions().height
  const ref = useRef<HostInstance>(null)
  const pending = useRef<(() => void) | null>(null)
  const [held, setHeld] = useState<Held | null>(null)
  const ios = Platform.OS === 'ios'

  const open = () => ref.current?.measureInWindow((_x, y, _w, height) => setHeld({ y, height }))
  const flush = () => {
    const run = pending.current
    pending.current = null
    run?.()
  }
  // iOS cannot present a route while the modal is still leaving, so the action waits for its dismiss.
  const pick = (action: MenuAction) => {
    pending.current = action.onPress
    setHeld(null)
    if (!ios) flush()
  }

  return (
    <>
      <View ref={ref} collapsable={false}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          accessibilityActions={actions.map((a) => ({ name: a.key, label: a.label }))}
          onAccessibilityAction={(e) => {
            const action = actions.find((a) => a.key === e.nativeEvent.actionName)
            if (action) action.onPress()
          }}
          onPress={onPress}
          onLongPress={open}
        >
          {children}
        </Pressable>
      </View>
      <Modal visible={held !== null} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setHeld(null)} onDismiss={flush}>
        {held ? (
          <View accessibilityViewIsModal style={StyleSheet.absoluteFill}>
            <Pressable accessibilityRole="button" accessibilityLabel="메뉴 닫기" onPress={() => setHeld(null)} style={StyleSheet.absoluteFill}>
              <Blur intensity={8} style={StyleSheet.absoluteFill} />
              <View style={[StyleSheet.absoluteFill, { backgroundColor: c.scrim }]} />
            </Pressable>
            <View
              pointerEvents="none"
              style={[
                {
                  position: 'absolute',
                  left: 10,
                  right: 10,
                  top: held.y,
                  height: held.height,
                  borderRadius: radius.card,
                  backgroundColor: c.card,
                  transform: [{ scale: 1.02 }],
                },
                shadow.pop,
              ]}
            >
              {children}
            </View>
            <View
              accessibilityRole="menu"
              accessibilityLabel={accessibilityLabel}
              style={[
                {
                  position: 'absolute',
                  right: POP.right,
                  width: POP.width,
                  top: popTop(held, POP.height(actions.length), screen - insets.bottom),
                  padding: POP.padding,
                  borderRadius: POP.radius,
                  backgroundColor: ios ? c.sheet : c.bg,
                  borderWidth: ios ? 0 : 1,
                  borderColor: c.line,
                },
                shadow.panel,
              ]}
            >
              {actions.map((action) => (
                <View key={action.key}>
                  {action.destructive ? (
                    <View
                      style={{
                        height: 1,
                        backgroundColor: c.line,
                        marginVertical: POP.dividerGap,
                        marginHorizontal: POP.itemPad,
                      }}
                    />
                  ) : null}
                  <Pressable
                    accessibilityRole="menuitem"
                    accessibilityLabel={action.label}
                    onPress={() => pick(action)}
                    style={{
                      minHeight: POP.item,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing[3],
                      padding: POP.itemPad,
                      borderRadius: radius.sm,
                    }}
                  >
                    {action.icon ? <Icon name={action.icon} size={20} color={action.destructive ? 'red' : 't1'} /> : null}
                    <Text color={action.destructive ? 'red' : 't1'} style={{ lineHeight: 21 }}>
                      {action.label}
                    </Text>
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </Modal>
    </>
  )
}

export default BotRowMenu
