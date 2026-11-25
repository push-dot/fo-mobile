import { View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { Text } from '@/shared/components'

const PostingSection = ({ title, items }: { title: string; items: string[] }) => {
  if (!items.length) return null
  return (
    <View style={styles.section}>
      <Text v="h3" accessibilityRole="header">
        {title}
      </Text>
      {items.map((item) => (
        <View key={item} style={styles.item}>
          <View style={styles.bullet} />
          <Text v="b2" color="t2" style={styles.text}>
            {item}
          </Text>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  section: { gap: theme.spacing[2] },
  item: { flexDirection: 'row', gap: theme.spacing[2] },
  bullet: { width: 4, height: 4, borderRadius: theme.radius.pill, backgroundColor: theme.colors.t3, marginTop: 10 },
  text: { flex: 1 },
}))

export default PostingSection
