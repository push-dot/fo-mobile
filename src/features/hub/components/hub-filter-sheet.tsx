import { Platform, PlatformColor, Pressable, View } from 'react-native'
import { CAREER_STATUSES } from '@push/api-client'
import { Chip, GlassButton, Text } from '../../../shared/components'
import { hitSlopTo, type } from '../../../theme'
import { EMPTY_SHEET, TENURE_CHIPS, tenureChipOn, toggle, toggleTenureChip, type Explore, type SheetFilters } from '../utils'
import HubFilterGroup from './hub-filter-group'

type Props = {
  draft: SheetFilters
  sent: number | undefined
  onChange: (sheet: SheetFilters) => void
  onClose: () => void
}

const exploreChip = (draft: SheetFilters, key: Explore, label: string, onChange: (sheet: SheetFilters) => void) => (
  <Chip key={key} label={label} check on={draft.explore === key} onPress={() => onChange({ ...draft, explore: key })} />
)

const HubFilterSheet = ({ draft, sent, onChange, onClose }: Props) => {
  const ios = Platform.OS === 'ios'
  const reset = (
    <Pressable accessibilityRole="button" onPress={() => onChange(EMPTY_SHEET)} hitSlop={{ ...hitSlopTo(type.c1.lineHeight), left: 12, right: 12 }}>
      {ios ? (
        <Text v="b1" style={{ color: PlatformColor('systemBlue') }}>
          초기화
        </Text>
      ) : (
        <Text v="c1" color="ac">
          초기화
        </Text>
      )}
    </Pressable>
  )
  return (
    <View style={{ gap: 14 }}>
      {ios ? (
        // HubFilter (iOS): glass ✕ left, centred title, system-blue 초기화 right.
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <GlassButton actions={[{ icon: 'x', label: '닫기', onPress: onClose }]} />
          <Text v="b1" weight="700" accessibilityRole="header" style={{ position: 'absolute', left: 0, right: 0, textAlign: 'center' }}>
            필터
          </Text>
          {reset}
        </View>
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text v="h2" accessibilityRole="header">
            필터
          </Text>
          {reset}
        </View>
      )}
      <HubFilterGroup title="재직 기간">
        {TENURE_CHIPS.map((t) => (
          <Chip key={t.label} label={t.label} check on={tenureChipOn(draft.tenure, t)} onPress={() => onChange({ ...draft, tenure: toggleTenureChip(draft.tenure, t) })} />
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
}

export default HubFilterSheet
