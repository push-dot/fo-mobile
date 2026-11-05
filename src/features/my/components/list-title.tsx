import { View } from 'react-native'
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
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        paddingTop: top,
        paddingBottom: spacing[1],
        paddingHorizontal: spacing[5],
      }}
    >
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

export default ListTitle
