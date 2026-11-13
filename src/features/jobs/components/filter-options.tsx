import ChoiceList from './choice-list'

const FilterOptions = <K extends string>({
  options,
  selected,
  onToggle,
}: {
  options: { key: K; label: string }[]
  selected: K[]
  onToggle: (k: K) => void
}) => <ChoiceList options={options} selected={selected} onToggle={(k) => onToggle(k as K)} />

export default FilterOptions
