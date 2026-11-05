import { Pressable, View } from 'react-native'
import { Text } from '@/shared/components'
import { spacing } from '../../../theme'

const SectionHead = ({ title, link, onLink, top = spacing[5] }: { title: string; link?: string; onLink?: () => void; top?: number }) => (
  <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingTop: top, paddingBottom: spacing[1], paddingHorizontal: spacing[5] }}>
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
