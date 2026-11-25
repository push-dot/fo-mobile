import { type ReactNode } from 'react'
import { Pressable } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'

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
}) => (
  <Pressable
    accessibilityRole={onPress ? 'button' : undefined}
    accessibilityLabel={label}
    disabled={!onPress}
    onPress={onPress}
    style={({ pressed }) => [styles.row, top && styles.top, pressed && styles.pressed]}
  >
    {children}
  </Pressable>
)

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: theme.spacing[5],
    backgroundColor: 'transparent',
    borderRadius: theme.radius.xs,
  },
  top: { alignItems: 'flex-start' },
  pressed: { backgroundColor: theme.colors.fill },
}))

export default Row
