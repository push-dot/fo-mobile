import { Pressable } from 'react-native'
import { Icon, Text } from '../../../shared/components'
import { radius, useColors } from '../../../theme'

const FilterRow = ({ label, count, on, check, onPress }: { label: string; count: string; on: boolean; check?: boolean; onPress: () => void }) => {
  const c = useColors()
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 10, height: 46, paddingHorizontal: 14, borderRadius: radius.sm, backgroundColor: on ? c.acSoft : undefined }}
    >
      <Text v="b1" weight={on ? '700' : '400'} color={on ? 'acText' : 't1'} style={{ flex: 1 }} numberOfLines={1}>
        {label}
      </Text>
      {count ? (
        <Text v="c1" color={on ? 'acText' : 't3'}>
          {count}
        </Text>
      ) : null}
      {on && check ? <Icon name="check" size={16} color="acText" /> : null}
    </Pressable>
  )
}

export default FilterRow
