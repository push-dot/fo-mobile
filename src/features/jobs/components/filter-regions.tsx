import { useState } from 'react'
import { ScrollView, View, type LayoutChangeEvent } from 'react-native'
import { usePostingLocations } from '../api/hooks'
import { SIDOS, formatCount, sidoOf, type Filters } from '../utils'
import FilterRow from './filter-row'
import { spacing, useColors } from '../../../theme'

// FilterRow is 46 high with 4 between rows: the sido column draws all 12 sidos, and the board's sheet is as tall as that column.
const ROW = 46
const ROW_GAP = 4
const LIST_HEIGHT = SIDOS.length * ROW + (SIDOS.length - 1) * ROW_GAP

type Props = { draft: Filters; onToggle: (v: string) => void; maxHeight?: number; onLayout?: (e: LayoutChangeEvent) => void }

const FilterRegions = ({ draft, onToggle, maxHeight = LIST_HEIGHT, onLayout }: Props) => {
  const c = useColors()
  const [sido, setSido] = useState<string>(draft.location[0] ? sidoOf(draft.location[0]) : SIDOS[0])
  const counts = usePostingLocations(draft)
  const districts = (counts.data ?? []).filter((d) => sidoOf(d.location) === sido && d.location !== sido)
  const sidoTotal = (counts.data ?? []).filter((d) => sidoOf(d.location) === sido).reduce((n, d) => n + d.count, 0)
  const rows = [{ value: sido, label: sido === '원격' ? '원격' : `${sido} 전체`, count: sidoTotal }].concat(
    districts.map((d) => ({ value: d.location, label: d.location.slice(sido.length + 1), count: d.count })),
  )
  return (
    <View style={{ flexDirection: 'row', gap: spacing[2], height: Math.min(LIST_HEIGHT, maxHeight) }} onLayout={onLayout}>
      <ScrollView
        style={{ width: 112, flexGrow: 0, borderRightWidth: 1, borderColor: c.line }}
        contentContainerStyle={{ gap: ROW_GAP, paddingRight: spacing[2] }}
        nestedScrollEnabled
      >
        {SIDOS.map((s) => (
          <FilterRow key={s} label={s} on={s === sido} count="" onPress={() => setSido(s)} />
        ))}
      </ScrollView>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: ROW_GAP }} nestedScrollEnabled>
        {rows.map((r) => (
          <FilterRow key={r.value} label={r.label} count={formatCount(r.count)} check on={draft.location.includes(r.value)} onPress={() => onToggle(r.value)} />
        ))}
      </ScrollView>
    </View>
  )
}

export default FilterRegions
