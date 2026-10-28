import { searchHangul } from '@push/shared'
import { useState } from 'react'
import { Chip, Text, TextField } from '../../../shared/components'
import { useProfile } from '../api/hooks'
import { POPULAR_SKILLS, SKILL_CATALOG } from '../constants'
import FilterGroup from './filter-group'

const FilterSkills = ({ selected, onToggle }: { selected: string[]; onToggle: (s: string) => void }) => {
  const [q, setQ] = useState('')
  const profile = useProfile()
  const mine = (profile.data?.skills ?? []).filter((s) => !selected.includes(s))
  const popular = POPULAR_SKILLS.filter((s) => !selected.includes(s))
  const found = q.trim() ? searchHangul(SKILL_CATALOG, q, (s) => [s]).map((r) => r.item) : []
  return (
    <>
      <TextField icon="search" placeholder="기술 검색" value={q} onChangeText={setQ} autoCorrect={false} autoCapitalize="none" returnKeyType="search" />
      {q.trim() ? (
        <FilterGroup title="검색 결과">
          {found.length ? (
            found.map((s) => <Chip key={s} label={s} check on={selected.includes(s)} onPress={() => onToggle(s)} />)
          ) : (
            <Text v="b2" color="t3">
              맞는 기술이 없어요. 다른 이름으로 찾아보세요.
            </Text>
          )}
        </FilterGroup>
      ) : null}
      {selected.length ? (
        <FilterGroup title="선택한 기술">
          {selected.map((s) => (
            <Chip key={s} label={s} on removable onPress={() => onToggle(s)} />
          ))}
        </FilterGroup>
      ) : null}
      {mine.length ? (
        <FilterGroup title="내 프로필 기술">
          {mine.map((s) => (
            <Chip key={s} label={s} onPress={() => onToggle(s)} />
          ))}
        </FilterGroup>
      ) : null}
      {popular.length ? (
        <FilterGroup title="많이 찾는 기술">
          {popular.map((s) => (
            <Chip key={s} label={s} onPress={() => onToggle(s)} />
          ))}
        </FilterGroup>
      ) : null}
    </>
  )
}

export default FilterSkills
