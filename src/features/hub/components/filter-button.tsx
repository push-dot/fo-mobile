import { View } from 'react-native'
import { GlassPressable, Icon, Text } from '../../../shared/components'
import { onAccent, radius, useColors } from '../../../theme'

const FilterButton = ({ count, onPress }: { count: number; onPress: () => void }) => {
  const c = useColors()
  return (
    <View>
      <GlassPressable
        accessibilityRole="button"
        accessibilityLabel={count ? `필터 ${count}개 적용됨` : '필터'}
        onPress={onPress}
        fill={null}
        style={{ width: 44, height: 44, borderRadius: radius.pill }}
      >
        <Icon name="filter" size={22} color={count ? c.acText : c.t1} />
      </GlassPressable>
      {count ? (
        <View pointerEvents="none" style={{ position: 'absolute', top: 4, right: 2, minWidth: 18, height: 18, paddingHorizontal: 5, borderRadius: radius.pill, backgroundColor: c.ac, borderWidth: 2, borderColor: c.bg, alignItems: 'center', justifyContent: 'center' }}>
          <Text v="c2" weight="800" style={{ color: onAccent }}>
            {count}
          </Text>
        </View>
      ) : null}
    </View>
  )
}

export default FilterButton
