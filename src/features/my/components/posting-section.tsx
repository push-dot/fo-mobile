import { View } from 'react-native'
import { Text } from '@/shared/components'
import { useColors } from '../../../theme'

const PostingSection = ({ title, items }: { title: string; items: string[] }) => {
  const c = useColors()
  if (!items.length) return null
  return (
    <View style={{ gap: 8 }}>
      <Text v="h3" accessibilityRole="header">
        {title}
      </Text>
      {items.map((item) => (
        <View key={item} style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: c.t3, marginTop: 10 }} />
          <Text v="b2" color="t2" style={{ flex: 1 }}>
            {item}
          </Text>
        </View>
      ))}
    </View>
  )
}

export default PostingSection
