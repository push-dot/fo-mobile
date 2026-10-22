import { Chip } from '../../../shared/components'
import FilterGroup from './filter-group'

const FilterOptions = <K extends string>({
  options,
  selected,
  onToggle,
}: {
  options: { key: K; label: string }[]
  selected: K[]
  onToggle: (k: K) => void
}) => (
  <FilterGroup title="여러 개 고를 수 있어요">
    {options.map((o) => (
      <Chip key={o.key} label={o.label} check on={selected.includes(o.key)} onPress={() => onToggle(o.key)} />
    ))}
  </FilterGroup>
)

export default FilterOptions
