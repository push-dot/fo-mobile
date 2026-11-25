import { Pressable } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { Text } from '@/shared/components'

const BubbleLink = ({ label, onPress, accessibilityLabel }: { label: string; onPress: () => void; accessibilityLabel?: string }) => (
  <Pressable accessibilityRole="link" accessibilityLabel={accessibilityLabel ?? label} onPress={onPress} hitSlop={8} style={styles.link}>
    <Text v="c1" color="t3" style={styles.text}>
      <Text v="c1" color="t3" style={[styles.text, styles.underline]}>
        {label}
      </Text>{' '}
      ›
    </Text>
  </Pressable>
)

const styles = StyleSheet.create({
  link: { alignSelf: 'flex-start' },
  text: { fontSize: 14, lineHeight: 20 },
  underline: { textDecorationLine: 'underline' },
})

export default BubbleLink
