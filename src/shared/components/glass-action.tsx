import { Pressable, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import type { IconName } from '@push/design-system'
import { useColors, type Colors } from '../../theme'
import { PRESS_SCALE } from './constants'
import Icon, { type AppIconName } from './icon'
import Menu from './menu'
import type { MenuProps } from './menu-action'
import Text from './text'
import { useXlChrome } from './xl-chrome'

type GlassAction = {
  icon: IconName | AppIconName
  label: string
  onPress?: () => void
  menu?: MenuProps['actions']
  active?: boolean
  color?: keyof Colors
  badge?: number
}

const GlassActionButton = ({ a, width, iconSize = 22, filled }: { a: GlassAction; width: number; iconSize?: number; filled?: boolean }) => {
  const c = useColors()
  const { button } = useXlChrome()
  const face = (
    <>
      <Icon name={a.icon} size={iconSize} color={a.active ? c.acText : c[a.color ?? 't1']} filled={a.active} />
      {a.badge ? (
        <View
          style={styles.badge}
        >
          <Text v="tab" weight="800" style={styles.badgeText}>
            {a.badge > 99 ? '99+' : a.badge}
          </Text>
        </View>
      ) : null}
    </>
  )
  if (a.menu) {
    return (
      <Menu actions={a.menu} accessibilityLabel={a.label}>
        <View style={[styles.box(button, width), filled && styles.filled]}>{face}</View>
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
      style={({ pressed }) => [styles.box(button, width), filled && styles.filled, filled && styles.pressable(pressed)]}
    >
      {face}
    </Pressable>
  )
}

const styles = StyleSheet.create((theme) => ({
  box: (height: number, minWidth: number) => ({ height, minWidth, alignItems: 'center', justifyContent: 'center' }),
  filled: { backgroundColor: theme.colors.fill, borderRadius: theme.radius.pill },
  pressable: (pressed: boolean) => ({ overflow: 'hidden', transform: [{ scale: pressed ? PRESS_SCALE : 1 }] }),
  badge: {
    position: 'absolute',
    top: 4,
    right: 2,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.t1,
    boxShadow: `0 0 0 2px ${theme.colors.bg}`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: theme.colors.bg },
}))

export type { GlassAction }

export default GlassActionButton
