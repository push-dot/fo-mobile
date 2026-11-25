import { Pressable, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { Icon, Text } from '@/shared/components'

const PickRow = ({ title, sub, onPress }: { title: string; sub: string; onPress: () => void }) => (
  <Pressable accessibilityRole="button" onPress={onPress} style={styles.row}>
    <View style={styles.body}>
      <Text v="b1" weight="700">
        {title}
      </Text>
      <Text v="c1" color="t3">
        {sub}
      </Text>
    </View>
    <Icon name="chev" size={18} color="t1" />
  </Pressable>
)

const styles = StyleSheet.create((theme) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3], paddingVertical: theme.spacing[3] },
  body: { flex: 1 },
}))

export default PickRow
