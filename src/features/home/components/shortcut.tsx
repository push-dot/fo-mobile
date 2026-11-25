import { router } from 'expo-router'
import { Platform, Pressable, View } from 'react-native'
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg'
import { StyleSheet } from 'react-native-unistyles'
import { Icon3D, Text } from '../../../shared/components'
import { type useShadow } from '../../../theme'
import { SHORTCUTS } from '../constants'

const androidIconShadow = ({ shadowOpacity, shadowRadius, shadowOffset }: ReturnType<typeof useShadow>['icon']) => ({
  filter: [{ dropShadow: { offsetX: shadowOffset.width, offsetY: shadowOffset.height, standardDeviation: shadowRadius, color: `rgba(0,0,0,${shadowOpacity})` } }],
})

const Shortcut = ({ label, icon, glow, opacity, href }: (typeof SHORTCUTS)[number]) => {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(href)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <Svg style={styles.glow}>
        <Defs>
          <RadialGradient id={`glow-${icon}`} cx="85%" cy="115%" rx="130%" ry="90%" fx="85%" fy="115%">
            <Stop offset="0" stopColor={glow} stopOpacity={opacity} />
            <Stop offset="0.62" stopColor={glow} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#glow-${icon})`} />
      </Svg>
      <Text v="b1" weight="700" style={styles.label}>
        {label}
      </Text>
      <View style={styles.icon}>
        <Icon3D name={icon} size={52} />
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create((theme) => ({
  card: { flex: 1, minHeight: 100, padding: 14, borderRadius: 22, overflow: 'hidden', backgroundColor: theme.colors.bg2, transform: [{ scale: 1 }] },
  pressed: { transform: [{ scale: 0.97 }] },
  glow: { position: 'absolute', inset: 0 },
  label: { lineHeight: theme.type.b2.lineHeight, paddingBottom: 40 },
  icon: {
    position: 'absolute',
    right: 6,
    bottom: 9,
    transform: [{ rotate: '-8deg' }],
    ...(Platform.OS === 'ios' ? theme.shadow.icon : androidIconShadow(theme.shadow.icon)),
  },
}))

export default Shortcut
