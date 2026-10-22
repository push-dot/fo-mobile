import type { ReactNode } from 'react'
import { Pressable, View } from 'react-native'
import { useColors } from '../../../theme'

const Row = ({ children, onPress, label, style }: { children: ReactNode; onPress?: () => void; label?: string; style?: object }) => {
  const c = useColors()
  if (!onPress) return <View style={style}>{children}</View>
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [{ minHeight: 44 }, style, pressed && { backgroundColor: c.fill }]}>
      {children}
    </Pressable>
  )
}

export default Row
