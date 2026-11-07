import { Pressable, View } from 'react-native'
import type { IconName } from '@push/design-system'
import { onAccent, radius, useColors } from '../../theme'
import { PRESS_SCALE } from './constants'
import Icon from './icon'
import Menu from './menu'
import type { MenuAction } from './menu-action'
import Text from './text'

export type GlassAction = {
  icon: IconName
  label: string
  onPress?: () => void
  menu?: MenuAction[]
  active?: boolean
  badge?: number
}

/** `filled`: the button is its own solid chip and answers presses like other solid buttons (ripple, 0.97). */
const GlassActionButton = ({ a, width, iconSize = 22, filled }: { a: GlassAction; width: number; iconSize?: number; filled?: boolean }) => {
  const c = useColors()
  const box = { height: 44, minWidth: width, alignItems: 'center', justifyContent: 'center' } as const
  const face = (
    <>
      <Icon name={a.icon} size={iconSize} color={a.active ? c.acText : c.t1} filled={a.active} />
      {a.badge ? (
        <View
          style={{
            position: 'absolute',
            top: 4,
            right: 2,
            minWidth: 18,
            height: 18,
            paddingHorizontal: 5,
            borderRadius: radius.pill,
            backgroundColor: c.red,
            boxShadow: `0 0 0 2px ${c.bg}`,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text v="tab" weight="800" style={{ color: onAccent }}>
            {a.badge > 99 ? '99+' : a.badge}
          </Text>
        </View>
      ) : null}
    </>
  )
  if (a.menu) {
    return (
      <Menu actions={a.menu} accessibilityLabel={a.label}>
        <View style={box}>{face}</View>
      </Menu>
    )
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a.label}
      accessibilityState={{ selected: !!a.active }}
      onPress={a.onPress}
      hitSlop={4}
      android_ripple={filled ? { color: c.fill2, foreground: true } : undefined}
      style={({ pressed }) => [
        box,
        filled ? { backgroundColor: c.fill, borderRadius: radius.pill, overflow: 'hidden', transform: [{ scale: pressed ? PRESS_SCALE : 1 }] } : null,
      ]}
    >
      {face}
    </Pressable>
  )
}

export default GlassActionButton
