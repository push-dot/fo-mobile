import type { ReactNode } from 'react'
import { View } from 'react-native'
import { Text } from '../../../shared/components'
import { spacing } from '../../../theme'

const HubFilterGroup = ({ title, children }: { title: string; children: ReactNode }) => (
  <View style={{ gap: spacing[2] }}>
    <Text v="c1" color="t3">
      {title}
    </Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing[2] }}>{children}</View>
  </View>
)

export default HubFilterGroup
