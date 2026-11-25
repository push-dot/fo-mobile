import { SECTION_LABEL } from '../constants'
import type { MaterialSection } from '../types'
import GroupTitle from './group-title'

const SectionTitle = ({ section, count }: { section: MaterialSection; count: number }) => <GroupTitle label={SECTION_LABEL[section]} count={count} />

export default SectionTitle
