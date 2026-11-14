import { Pressable } from 'react-native'
import { Icon, Text } from '../../../shared/components'
import { radius, spacing, useColors } from '../../../theme'

// FilterRegion: the selected row is the soft accent fill with black bold text, count and check (owner rule 3: the accent is the fill only).
const FilterRow = ({ label, count, on, check, onPress }: { label: string; count: string; on: boolean; check?: boolean; onPress: () => void }) => {
  const c = useColors()
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3], height: 46, paddingHorizontal: spacing[4], borderRadius: radius.sm, backgroundColor: on ? c.acSoft : undefined }}
    >
      <Text v="b1" weight={on ? '700' : '400'} color="t1" style={{ flex: 1 }} numberOfLines={1}>
        {label}
      </Text>
      {count ? (
        <Text v="c1" weight={on ? '700' : undefined} color={on ? 't1' : 't3'}>
          {count}
        </Text>
      ) : null}
      {on && check ? <Icon name="check" size={16} color="t1" /> : null}
    </Pressable>
  )
}

export default FilterRow
