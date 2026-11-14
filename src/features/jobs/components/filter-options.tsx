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
  <FilterGroup>
    {options.map((o) => (
      <Chip sheet key={o.key} label={o.label} check on={selected.includes(o.key)} onPress={() => onToggle(o.key)} />
    ))}
  </FilterGroup>
)

export default FilterOptions
