import type { ReactNode } from 'react'
import { View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { Icon, Text } from '@/shared/components'
import { displayName } from '@/shared/utility/display-name'
import { userBubbleChipFill, userBubbleFill } from '../../../theme'

const CHIP_TEXT = { lineHeight: 23, flexShrink: 1 } as const

const UserBubbleView = ({ children, attachment, minWidth }: { children: ReactNode; attachment?: string; minWidth?: number }) => {
  return (
    <View style={styles.bubble(minWidth)}>
      {children}
      {attachment ? (
        <View style={styles.chip}>
          <Icon name="pdf" size={16} color="t2" />
          <Text v="c1" weight="600" numberOfLines={1} style={CHIP_TEXT}>
            {displayName(attachment)}
          </Text>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  bubble: (minWidth?: number) => ({ paddingVertical: 11, paddingHorizontal: 15, borderRadius: theme.radius.lg, borderBottomRightRadius: theme.radius.xs, backgroundColor: userBubbleFill[theme.mode], minWidth }),
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: theme.spacing[2], paddingVertical: theme.spacing[2], paddingHorizontal: 10, borderRadius: theme.radius.sm, backgroundColor: userBubbleChipFill[theme.mode] },
}))

export default UserBubbleView
