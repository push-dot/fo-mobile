import { View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { Text } from '@/shared/components'
import { spacing } from '../../../theme'

const ListTitle = ({
  title,
  count,
  top = spacing[4],
}: {
  title: string
  count?: number
  top?: number
}) => {
  return (
    <View style={styles.row(top)}>
      <Text v="h2" accessibilityRole="header">
        {title}
      </Text>
      {count !== undefined ? (
        <Text v="c1" weight="600" color="t3">
          {count}개
        </Text>
      ) : null}
    </View>
  )
}

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

export default ListTitle
