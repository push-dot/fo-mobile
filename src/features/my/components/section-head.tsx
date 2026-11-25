import { Pressable, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { Text } from '@/shared/components'
import { spacing } from '../../../theme'

const SectionHead = ({ title, link, onLink, top = spacing[4] }: { title: string; link?: string; onLink?: () => void; top?: number }) => (
  <View style={styles.row(top)}>
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

const styles = StyleSheet.create((theme) => ({
  row: (top: number) => ({
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingTop: top,
    paddingBottom: theme.spacing[1],
    paddingHorizontal: theme.spacing[5],
  }),
}))

export default SectionHead
