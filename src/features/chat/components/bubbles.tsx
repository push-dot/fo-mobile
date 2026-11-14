import type { ReactNode } from 'react'
import { View } from 'react-native'
import { Icon, Text } from '@/shared/components'
import { radius, spacing, userBubbleChipFill, userBubbleFill, useThemeMode } from '../../../theme'

/** The board's .att chip (c1 600) sits in the bubble's 23 line under 8/10 padding, so it stands 39 high (ChatErrUpload). */
const CHIP_TEXT = { lineHeight: 23, flexShrink: 1 } as const

/** `minWidth` is the bubble's max width once its text wraps: a wrapped CSS box fills its max-width, a native Text box hugs its longest line. */
const UserBubbleView = ({ children, attachment, minWidth }: { children: ReactNode; attachment?: string; minWidth?: number }) => {
  const mode = useThemeMode()
  return (
    <View style={{ paddingVertical: 11, paddingHorizontal: 15, borderRadius: radius.lg, borderBottomRightRadius: radius.xs, backgroundColor: userBubbleFill[mode], minWidth }}>
      {children}
      {attachment ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing[2], paddingVertical: spacing[2], paddingHorizontal: 10, borderRadius: radius.sm, backgroundColor: userBubbleChipFill[mode] }}>
          <Icon name="pdf" size={16} color="t2" />
          <Text v="c1" weight="600" numberOfLines={1} style={CHIP_TEXT}>
            {attachment}
          </Text>
        </View>
      ) : null}
    </View>
  )
}

export default UserBubbleView
