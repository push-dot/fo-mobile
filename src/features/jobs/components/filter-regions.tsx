import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { Chip, Text, WheelPicker } from '../../../shared/components'
import { onAccent, radius, spacing, useColors } from '../../../theme'
import { usePostingLocations } from '../api/hooks'
import { MAX_REGIONS, SIDOS, addRegion, regionLabel, sidoOf, type Filters } from '../utils'

const sidoOptions = SIDOS.map((s) => ({ key: s, label: s }))

/** Two wheels (시·도, then 구) in the sheet; 추가 turns the current pick into a chip, up to MAX_REGIONS. */
const FilterRegions = ({ draft, onChange }: { draft: Filters; onChange: (location: string[]) => void }) => {
  const c = useColors()
  const [sido, setSido] = useState<string>(draft.location[0] ? sidoOf(draft.location[0]) : SIDOS[0])
  const [pick, setPick] = useState<string>(sido)
  const counts = usePostingLocations(draft)
  const districts = (counts.data ?? []).filter((d) => sidoOf(d.location) === sido && d.location !== sido)
  const guOptions = [{ key: sido, label: sido === '원격' ? '원격' : '전체' }].concat(districts.map((d) => ({ key: d.location, label: d.location.slice(sido.length + 1) })))
  const value = guOptions.some((o) => o.key === pick) ? pick : sido
  const picked = draft.location
  const canAdd = !picked.includes(value) && addRegion(picked, value) !== picked
  const changeSido = (next: string) => {
    setSido(next)
    setPick(next)
  }
  return (
    <View style={{ gap: spacing[3] }}>
      <View style={{ flexDirection: 'row', gap: spacing[2] }}>
        <WheelPicker columns accessibilityLabel="시·도" items={sidoOptions} value={sido} onChange={changeSido} />
        <WheelPicker columns accessibilityLabel="구" items={guOptions} value={value} onChange={setPick} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 }}>
        <Text v="b1" weight="700">
          {regionLabel(value)}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !canAdd }}
          disabled={!canAdd}
          onPress={() => onChange(addRegion(picked, value))}
          style={{
            minHeight: 36,
            minWidth: 56,
            paddingHorizontal: spacing[4],
            borderRadius: radius.pill,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: c.ac,
            opacity: canAdd ? 1 : 0.4,
          }}
        >
          <Text v="c1" weight="700" style={{ color: onAccent }}>
            추가
          </Text>
        </Pressable>
      </View>
      {picked.length ? (
        <View style={{ gap: spacing[2] }}>
          <Text v="c1" color="t3">{`고른 지역 ${picked.length} · 최대 ${MAX_REGIONS}곳`}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}>
            {picked.map((v) => (
              <Chip key={v} label={regionLabel(v)} removable onPress={() => onChange(picked.filter((x) => x !== v))} />
            ))}
          </View>
        </View>
      ) : null}
    </View>
  )
}

export default FilterRegions
