import { useState } from 'react'
import { ScrollView, View } from 'react-native'
import { usePostingLocations } from '../api/hooks'
import { SIDOS, formatCount, sidoOf, type Filters } from '../utils'
import FilterRow from './filter-row'
import { spacing, useColors } from '../../../theme'

const FilterRegions = ({ draft, onToggle }: { draft: Filters; onToggle: (v: string) => void }) => {
  const c = useColors()
  const [sido, setSido] = useState<string>(draft.location[0] ? sidoOf(draft.location[0]) : SIDOS[0])
  const counts = usePostingLocations(draft)
  const districts = (counts.data ?? []).filter((d) => sidoOf(d.location) === sido && d.location !== sido)
  const sidoTotal = (counts.data ?? []).filter((d) => sidoOf(d.location) === sido).reduce((n, d) => n + d.count, 0)
  const rows = [{ value: sido, label: sido === '원격' ? '원격' : `${sido} 전체`, count: sidoTotal }].concat(
    districts.map((d) => ({ value: d.location, label: d.location.slice(sido.length + 1), count: d.count })),
  )
  return (
    <View style={{ flexDirection: 'row', gap: spacing[2], height: 300 }}>
      <View style={{ width: 112, gap: spacing[1], borderRightWidth: 1, borderColor: c.line, paddingRight: spacing[2] }}>
        {SIDOS.map((s) => (
          <FilterRow key={s} label={s} on={s === sido} count="" onPress={() => setSido(s)} />
        ))}
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: spacing[1] }} nestedScrollEnabled>
        {rows.map((r) => (
          <FilterRow key={r.value} label={r.label} count={formatCount(r.count)} check on={draft.location.includes(r.value)} onPress={() => onToggle(r.value)} />
        ))}
      </ScrollView>
    </View>
  )
}

export default FilterRegions
