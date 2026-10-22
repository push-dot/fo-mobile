import type { ReactNode } from 'react'
import { View } from 'react-native'
import { Text } from '../../../shared/components'

const HubFilterGroup = ({ title, children }: { title: string; children: ReactNode }) => (
  <View style={{ gap: 10 }}>
    <Text v="b2" weight="700">
      {title}
    </Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>{children}</View>
  </View>
)

export default HubFilterGroup
