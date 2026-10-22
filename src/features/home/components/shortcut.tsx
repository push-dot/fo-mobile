import { router } from 'expo-router'
import { Pressable, View } from 'react-native'
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg'
import { Icon3D, Text } from '../../../shared/components'
import { useColors } from '../../../theme'
import { SHORTCUTS } from '../constants'

const Shortcut = ({ label, icon, glow, opacity, href }: (typeof SHORTCUTS)[number]) => {
  const c = useColors()
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(href)}
      style={({ pressed }) => ({ flex: 1, height: 100, borderRadius: 22, overflow: 'hidden', backgroundColor: c.bg2, transform: [{ scale: pressed ? 0.97 : 1 }] })}
    >
      <Svg style={{ position: 'absolute', inset: 0 }} width="100%" height="100%">
        <Defs>
          <RadialGradient id={`glow-${icon}`} cx="85%" cy="115%" rx="130%" ry="90%" fx="85%" fy="115%">
            <Stop offset="0" stopColor={glow} stopOpacity={opacity} />
            <Stop offset="0.62" stopColor={glow} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#glow-${icon})`} />
      </Svg>
      <Text v="b1" weight="700" style={{ position: 'absolute', left: 14, top: 14, lineHeight: 22 }}>
        {label}
      </Text>
      <View
        style={{
          position: 'absolute',
          right: 6,
          bottom: 4,
          transform: [{ rotate: '-8deg' }],
          shadowColor: '#000000',
          shadowOpacity: 0.18,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 6 },
        }}
      >
        <Icon3D name={icon} size={52} />
      </View>
    </Pressable>
  )
}

export default Shortcut
