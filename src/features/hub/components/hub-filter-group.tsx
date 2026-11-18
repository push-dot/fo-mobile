import type { ReactNode } from 'react'
import { Platform, View } from 'react-native'
import { SheetHead, Text } from '../../../shared/components'
import { spacing } from '../../../theme'

const HubFilterGroup = ({ title, children }: { title: string; children: ReactNode }) => {
  const ios = Platform.OS === 'ios'
  return (
    <View style={{ gap: ios ? 0 : spacing[2] }}>
      {ios ? (
        <SheetHead>{title}</SheetHead>
      ) : (
        <Text v="c1" color="t3">
          {title}
        </Text>
      )}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing[2] }}>{children}</View>
    </View>
  )
}

export default HubFilterGroup
