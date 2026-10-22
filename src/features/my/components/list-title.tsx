import { View } from 'react-native'
import { Text } from '@/shared/components'

const ListTitle = ({
  title,
  count,
  top = 14,
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
        paddingBottom: 4,
        paddingHorizontal: 20,
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
