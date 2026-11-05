import { Pressable, View } from 'react-native'
import { Text } from '@/shared/components'

const SectionHead = ({ title, link, onLink, top = 26 }: { title: string; link?: string; onLink?: () => void; top?: number }) => (
  <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingTop: top, paddingBottom: 4, paddingHorizontal: 20 }}>
    <Text v="h2" accessibilityRole="header">
      {title}
    </Text>
    {link && onLink ? (
      <Pressable accessibilityRole="button" hitSlop={10} onPress={onLink}>
        <Text v="c1" weight="600" color="t2">
          {link}
        </Text>
      </Pressable>
    ) : null}
  </View>
)

export default SectionHead
