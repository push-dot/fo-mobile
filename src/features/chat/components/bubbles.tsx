import type { ReactNode } from 'react'
import { View } from 'react-native'
import { Icon, Text } from '@/shared/components'
import { radius, spacing, userBubbleChipFill, userBubbleFill, useThemeMode } from '../../../theme'

const UserBubbleView = ({ children, attachment }: { children: ReactNode; attachment?: string }) => {
  const mode = useThemeMode()
  return (
    <View style={{ paddingVertical: 11, paddingHorizontal: 15, borderRadius: radius.lg, borderBottomRightRadius: radius.xs, backgroundColor: userBubbleFill[mode] }}>
      {children}
      {attachment ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing[2], paddingVertical: spacing[2], paddingHorizontal: 10, borderRadius: radius.sm, backgroundColor: userBubbleChipFill[mode] }}>
          <Icon name="pdf" size={16} color="t2" />
          <Text v="c1" weight="600" numberOfLines={1} style={{ flexShrink: 1 }}>
            {attachment}
          </Text>
        </View>
      ) : null}
    </View>
  )
}

export default UserBubbleView
