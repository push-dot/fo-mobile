import { router } from 'expo-router'
import { Platform, Pressable, View } from 'react-native'
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg'
import { Icon3D, Text } from '../../../shared/components'
import { type, useColors, useShadow } from '../../../theme'
import { SHORTCUTS } from '../constants'

// Android ignores `shadow*`; the icon is not a rectangle, so it takes a drop shadow of its own pixels rather than a box shadow.
const androidIconShadow = ({ shadowOpacity, shadowRadius, shadowOffset }: ReturnType<typeof useShadow>['icon']) => ({
  filter: [{ dropShadow: { offsetX: shadowOffset.width, offsetY: shadowOffset.height, standardDeviation: shadowRadius, color: `rgba(0,0,0,${shadowOpacity})` } }],
})

const Shortcut = ({ label, icon, glow, opacity, href }: (typeof SHORTCUTS)[number]) => {
  const c = useColors()
  const shadow = useShadow()
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(href)}
      style={({ pressed }) => ({ flex: 1, minHeight: 100, padding: 14, borderRadius: 22, overflow: 'hidden', backgroundColor: c.bg2, transform: [{ scale: pressed ? 0.97 : 1 }] })}
    >
      {/* No width/height props: 100% there resolves against the padded content box and clips the glow to a rectangle. */}
      <Svg style={{ position: 'absolute', inset: 0 }}>
        <Defs>
          <RadialGradient id={`glow-${icon}`} cx="85%" cy="115%" rx="130%" ry="90%" fx="85%" fy="115%">
            <Stop offset="0" stopColor={glow} stopOpacity={opacity} />
            <Stop offset="0.62" stopColor={glow} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#glow-${icon})`} />
      </Svg>
      <Text v="b1" weight="700" style={{ lineHeight: type.b2.lineHeight, paddingBottom: 40 }}>
        {label}
      </Text>
      <View
        style={{
          position: 'absolute',
          right: 6,
          bottom: 4,
          transform: [{ rotate: '-8deg' }],
          ...(Platform.OS === 'ios' ? shadow.icon : androidIconShadow(shadow.icon)),
        }}
      >
        <Icon3D name={icon} size={52} />
      </View>
    </Pressable>
  )
}

export default Shortcut
