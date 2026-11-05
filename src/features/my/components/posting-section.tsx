import { View } from 'react-native'
import { Text } from '@/shared/components'
import { radius, spacing, useColors } from '../../../theme'

const PostingSection = ({ title, items }: { title: string; items: string[] }) => {
  const c = useColors()
  if (!items.length) return null
  return (
    <View style={{ gap: spacing[2] }}>
      <Text v="h3" accessibilityRole="header">
        {title}
      </Text>
      {items.map((item) => (
        <View key={item} style={{ flexDirection: 'row', gap: spacing[2] }}>
          <View style={{ width: 4, height: 4, borderRadius: radius.pill, backgroundColor: c.t3, marginTop: 10 }} />
          <Text v="b2" color="t2" style={{ flex: 1 }}>
            {item}
          </Text>
        </View>
      ))}
    </View>
  )
}

export default PostingSection
