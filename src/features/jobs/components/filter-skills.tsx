import { searchHangul } from '@push/shared'
import { useState } from 'react'
import { Text, TextField } from '../../../shared/components'
import { useProfile } from '../api/hooks'
import { POPULAR_SKILL_COUNT, SKILL_CATALOG } from '../constants'
import ChoiceList from './choice-list'

const asOptions = (skills: string[]) => skills.map((s) => ({ key: s, label: s }))

const FilterSkills = ({ selected, trending, onToggle }: { selected: string[]; trending: string[]; onToggle: (s: string) => void }) => {
  const [q, setQ] = useState('')
  const profile = useProfile()
  const mine = (profile.data?.skills ?? []).filter((s) => !selected.includes(s))
  const popular = trending.filter((s) => !selected.includes(s)).slice(0, POPULAR_SKILL_COUNT)
  const found = q.trim() ? searchHangul(SKILL_CATALOG, q, (s) => [s]).map((r) => r.item) : []
  const group = (title: string, skills: string[]) => (skills.length ? <ChoiceList title={title} options={asOptions(skills)} selected={selected} onToggle={onToggle} /> : null)
  return (
    <>
      <TextField compact icon="search" placeholder="기술 검색" value={q} onChangeText={setQ} autoCorrect={false} autoCapitalize="none" returnKeyType="search" />
      {q.trim() ? (
        found.length ? (
          group('검색 결과', found)
        ) : (
          <Text v="b2" color="t3">
            맞는 기술이 없어요. 다른 이름으로 찾아보세요.
          </Text>
        )
      ) : null}
      {group('선택한 기술', selected)}
      {group('내 프로필 기술', mine)}
      {group('많이 찾는 기술', popular)}
    </>
  )
}

export default FilterSkills
