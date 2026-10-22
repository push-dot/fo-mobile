import { type ReactNode } from 'react'
import { Pressable } from 'react-native'
import { radius, useColors } from '../../../theme'

const Row = ({
  children,
  onPress,
  label,
  top,
}: {
  children: ReactNode
  onPress?: () => void
  label?: string
  top?: boolean
}) => {
  const c = useColors()
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={label}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: top ? 'flex-start' : 'center',
        gap: 14,
        paddingVertical: 14,
        paddingHorizontal: 20,
        backgroundColor: pressed ? c.fill : 'transparent',
        borderRadius: radius.xs,
      })}
    >
      {children}
    </Pressable>
  )
}

export default Row
