import type { FilterKey, Filters } from '../utility'
import FilterSheetBody from './filter-sheet-body'

type Props = {
  kind: FilterKey | null
  value: Filters
  onApply: (f: Filters) => void
  onClose: () => void
}

const FilterSheet = ({ kind, value, onApply, onClose }: Props) =>
  kind ? <FilterSheetBody key={kind} kind={kind} value={value} onApply={onApply} onClose={onClose} /> : null

export default FilterSheet
