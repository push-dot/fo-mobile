import { Platform, Pressable, View } from 'react-native'
import { Chip, Icon, Text } from '../../../shared/components'
import { radius, spacing, useColors } from '../../../theme'
import FilterGroup from './filter-group'

type Option = { key: string; label: string }

const ROW = 54

/** iOS: an inset grouped list with checkmarks. Android: Material filter chips. */
const ChoiceList = ({ title, options, selected, onToggle }: { title?: string; options: Option[]; selected: readonly string[]; onToggle: (key: string) => void }) => {
  const c = useColors()
  if (Platform.OS === 'android')
    return (
      <FilterGroup title={title}>
        {options.map((o) => (
          <Chip key={o.key} label={o.label} check on={selected.includes(o.key)} onPress={() => onToggle(o.key)} />
        ))}
      </FilterGroup>
    )
  return (
    <View style={{ gap: spacing[2] }}>
      {title ? (
        <Text v="c1" color="t3" style={{ paddingHorizontal: spacing[4] }}>
          {title}
        </Text>
      ) : null}
      <View style={{ borderRadius: radius.md, backgroundColor: c.bg2, overflow: 'hidden' }}>
        {options.map((o, i) => {
          const on = selected.includes(o.key)
          return (
            <Pressable
              key={o.key}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              onPress={() => onToggle(o.key)}
              style={{ minHeight: ROW, flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingHorizontal: spacing[4], borderTopWidth: i ? 1 : 0, borderTopColor: c.line }}
            >
              <Text v="b1" style={{ flex: 1 }} numberOfLines={1}>
                {o.label}
              </Text>
              {on ? <Icon name="check" size={18} color="ac" /> : null}
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

export default ChoiceList
