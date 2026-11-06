import { Pressable, View } from 'react-native'
import { CAREER_STATUSES, TENURES } from '@push/api-client'
import { Chip, Text } from '../../../shared/components'
import { hitSlopTo, type } from '../../../theme'
import { EMPTY_SHEET, toggle, type Explore, type SheetFilters } from '../utils'
import HubFilterGroup from './hub-filter-group'

type Props = {
  draft: SheetFilters
  sent: number | undefined
  onChange: (sheet: SheetFilters) => void
}

const exploreChip = (draft: SheetFilters, key: Explore, label: string, onChange: (sheet: SheetFilters) => void) => (
  <Chip key={key} label={label} check on={draft.explore === key} onPress={() => onChange({ ...draft, explore: key })} />
)

const HubFilterSheet = ({ draft, sent, onChange }: Props) => (
  <View style={{ gap: 14 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Text v="h2" accessibilityRole="header">
        필터
      </Text>
      <Pressable accessibilityRole="button" onPress={() => onChange(EMPTY_SHEET)} hitSlop={{ ...hitSlopTo(type.c1.lineHeight), left: 12, right: 12 }}>
        <Text v="c1" weight="700" color="ac">
          초기화
        </Text>
      </Pressable>
    </View>
    <HubFilterGroup title="재직 기간">
      {TENURES.map((t) => (
        <Chip key={t.key} label={t.label} check on={draft.tenure.includes(t.key)} onPress={() => onChange({ ...draft, tenure: toggle(draft.tenure, t.key) })} />
      ))}
    </HubFilterGroup>
    <HubFilterGroup title="커리어 상태">
      {CAREER_STATUSES.map((s) => (
        <Chip key={s.key} label={s.label} check on={draft.status.includes(s.key)} onPress={() => onChange({ ...draft, status: toggle(draft.status, s.key) })} />
      ))}
    </HubFilterGroup>
    <HubFilterGroup title="탐색">
      {exploreChip(draft, 'recommended', '추천', onChange)}
      {exploreChip(draft, 'received', '제안', onChange)}
      {exploreChip(draft, 'offers', `보낸 제안${sent === undefined ? '' : ` ${sent}`}`, onChange)}
    </HubFilterGroup>
  </View>
)

export default HubFilterSheet
