import { View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { Text } from '@/shared/components'

const GroupTitle = ({ label, count }: { label: string; count?: number }) => {
  return (
    <View accessible accessibilityRole="header" accessibilityLabel={count === undefined ? label : `${label} ${count}`} style={styles.group}>
      <Text v="c1" weight="700" color="t3">
        {label}
      </Text>
      {count === undefined ? null : (
        <Text v="c1" weight="700" color="t3">
          {count}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  group: { flexDirection: 'row', gap: 6, paddingTop: 18, paddingBottom: 6, paddingHorizontal: theme.spacing[5] },
}))

export default GroupTitle
